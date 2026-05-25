import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '../../components/ui/Button';

// Fix leaflet marker icon issue in React/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetina,
    iconUrl: icon,
    shadowUrl: iconShadow,
});

const MapUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 15);
    }, [center, map]);
    return null;
};

export const TravelMap: React.FC<{ event: any }> = ({ event }) => {
    const address = event.address || event.locationName || 'Luanda, Angola';
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchCoordinates = async () => {
            try {
                // OpenStreetMap Nominatim is 100% Free
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
                const data = await response.json();
                if (data && data.length > 0) {
                    setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Geocoding error:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchCoordinates();
    }, [address]);

    return (
        <div className="w-full my-8 bg-white border border-slate-100 p-2 md:p-3 rounded-[2rem] shadow-xl overflow-hidden relative">
             <div className="absolute top-6 left-6 z-[1000] bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-lg border border-slate-100 max-w-[80%] md:max-w-xs">
                 <h3 className="font-bold text-slate-800 text-lg mb-1">{event.locationName || 'Localização'}</h3>
                 <p className="text-slate-500 text-sm leading-relaxed mb-3">{event.address}</p>
                 <Button onClick={() => window.open(event.mapLink || `https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank')} variant="navy" className="w-full text-xs shadow-lg" size="sm">
                     Ver Rota Exata no Maps
                 </Button>
             </div>
             
             <div className="w-full h-[400px] md:h-[500px] rounded-[1.5rem] overflow-hidden bg-slate-50 flex items-center justify-center relative z-0">
                {loading ? (
                    <div className="animate-pulse text-slate-400 font-bold uppercase tracking-widest text-sm">A procurar coordenadas...</div>
                ) : error && !position ? (
                    <div className="text-center p-8 z-10">
                        <div className="text-4xl mb-4">🗺️</div>
                        <p className="text-slate-500 mb-4 font-medium max-w-sm">Não foi possível gerar a pré-visualização automática do mapa para esta morada.</p>
                        <Button onClick={() => window.open(event.mapLink || `https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank')} variant="outline">
                            Abrir Localização Directamente
                        </Button>
                    </div>
                ) : position ? (
                    <MapContainer center={position} zoom={15} style={{ width: '100%', height: '100%', zIndex: 0 }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={position}>
                            <Popup>
                                <strong className="font-sans text-brand-blue">{event.locationName}</strong><br />
                                <span className="font-sans text-slate-600 text-xs">{event.address}</span>
                            </Popup>
                        </Marker>
                        <MapUpdater center={position} />
                    </MapContainer>
                ) : null}
             </div>
        </div>
    );
};
