import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, AlertCircle } from 'lucide-react';

interface QRScannerProps {
    onScan: (result: string) => void;
    onError?: (error: any) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        let isMounted = true;
        
        const timer = setTimeout(() => {
            const html5QrCode = new Html5Qrcode("qr-reader");
            scannerRef.current = html5QrCode;

            const startScanner = async () => {
                try {
                    const devices = await Html5Qrcode.getCameras();
                    if (devices && devices.length > 0) {
                        try {
                            await html5QrCode.start(
                                { facingMode: "environment" },
                                {
                                    fps: 10,
                                    qrbox: { width: 250, height: 250 },
                                    aspectRatio: 1
                                },
                                (decodedText) => {
                                    if (isMounted) onScan(decodedText);
                                },
                                (errorMessage) => {
                                   
                                }
                            );
                            if (isMounted) setHasPermission(true);
                        } catch (err: any) {
                            console.error("Failed to start scanner execution", err);
                            if (isMounted) {
                                setHasPermission(false);
                                if (err?.name === 'NotReadableError' || err?.message?.includes('NotReadableError')) {
                                    setCameraError("Câmera em uso por outro app. Feche outras abas ou apps e tente novamente.");
                                } else {
                                    setCameraError(err?.message || "Não foi possível iniciar a câmera.");
                                }
                            }
                        }
                    } else {
                        if (isMounted) {
                            setHasPermission(false);
                            setCameraError("Nenhuma câmera encontrada no dispositivo.");
                        }
                    }
                } catch (err: any) {
                    console.error("Failed to get cameras", err);
                    if (isMounted) {
                        setHasPermission(false);
                        setCameraError("Permissão de câmera negada. Autorize no seu navegador.");
                    }
                }
            };

            startScanner();
        }, 100);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            try {
                if (scannerRef.current?.isScanning) {
                    scannerRef.current.stop()
                        .then(() => scannerRef.current?.clear())
                        .catch((e) => console.error("Error stopping scanner", e));
                } else {
                    scannerRef.current?.clear();
                }
            } catch (e) {
                console.error("Cleanup error", e);
            }
        };
    }, []);

    return (
        <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
            <div id="qr-reader" className="w-full h-full [&>video]:object-cover" />
            {hasPermission === false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900 z-20 p-6 text-center">
                    <AlertCircle size={48} className="mb-4 text-red-400" />
                    <p className="font-bold text-lg mb-2">Erro na Câmera</p>
                    <p className="text-slate-400 text-sm mb-4">{cameraError}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-brand-blue text-white rounded-lg font-medium hover:bg-brand-blue/90 transition-colors shadow-lg"
                    >
                        Tentar Novamente
                    </button>
                </div>
            )}
            {hasPermission === null && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900 z-20 p-6 text-center">
                    <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                    <p className="text-slate-400 text-sm font-medium animate-pulse">Iniciando câmera...</p>
                </div>
            )}
        </div>
    );
};
