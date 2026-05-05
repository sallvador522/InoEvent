import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { QRCodeSVG } from 'qrcode.react'; 
import { Save, QrCode, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useFirebase, db, handleFirestoreError, OperationType } from '../../components/FirebaseProvider';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export const InvitationCreator: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useFirebase();
    const [formData, setFormData] = useState({
        groomName: '',
        brideName: '',
        date: '',
        time: '',
        location: '',
        description: 'Estamos ansiosos para celebrar nosso amor com você!',
        iban: '',
        accountName: '',
        bankName: '',
        contactPhone: ''
    });
    
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(!!id);
    
    useEffect(() => {
        const loadEvent = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, 'events', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        groomName: data.groomName || '',
                        brideName: data.brideName || '',
                        date: data.date || '',
                        time: data.time || '',
                        location: data.location || '',
                        description: data.description || '',
                        iban: data.iban || '',
                        accountName: data.accountName || '',
                        bankName: data.bankName || '',
                        contactPhone: data.contactPhone || ''
                    });
                }
            } catch (error) {
                handleFirestoreError(error, OperationType.GET, `events/${id}`);
                alert("Erro ao carregar os dados do evento.");
            } finally {
                setIsLoading(false);
            }
        };
        loadEvent();
    }, [id]);
    
    const handleSubmit = async () => {
        if (!formData.groomName || !formData.brideName || !formData.date || !formData.location) {
            alert('Por favor, preencha todos os campos obrigatórios!');
            return;
        }

        if (!user) {
            alert('Você precisa estar logado para salvar um evento.');
            return;
        }

        setIsSaving(true);
        try {
            const finalData = { 
                ...formData, 
                title: `${formData.groomName} & ${formData.brideName}`,
                ownerId: user.uid,
                layoutMode: 'MODERN'
            };
            
            if (id) {
                const docRef = doc(db, 'events', id);
                await updateDoc(docRef, finalData);
                navigate(`/invite/${id}`);
            } else {
                const newEventId = "evt_" + Math.random().toString(36).substr(2, 9);
                const docRef = doc(db, 'events', newEventId);
                await setDoc(docRef, finalData);
                navigate(`/invite/${newEventId}`);
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, 'events');
            alert('Erro ao salvar o evento.');
        } finally {
            setIsSaving(false);
        }
    }
    
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-display">
                <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-display">
            <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <div className="flex items-center mb-6">
                    <Link to="/" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors mr-4">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold text-brand-blue">{id ? "Editar Convite" : "Criar Convite - Plano Essencial"}</h1>
                </div>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Nome do Noivo" value={formData.groomName} onChange={e => setFormData({...formData, groomName: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 text-slate-900" />
                        <input type="text" placeholder="Nome da Noiva" value={formData.brideName} onChange={e => setFormData({...formData, brideName: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 text-slate-900" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Data</label>
                          <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 text-slate-900" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Hora</label>
                          <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 text-slate-900" />
                      </div>
                    </div>

                    <input type="text" placeholder="Localização do Evento (Link Google Maps)" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 text-slate-900" />
                    
                    <div className="grid grid-cols-3 gap-4">
                        <input type="text" placeholder="IBAN" value={formData.iban} onChange={e => setFormData({...formData, iban: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 text-slate-900" />
                        <input type="text" placeholder="Nome da Conta" value={formData.accountName} onChange={e => setFormData({...formData, accountName: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 text-slate-900" />
                        <input type="text" placeholder="Banco" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 text-slate-900" />
                    </div>
                    
                    <input type="text" placeholder="WhatsApp do Organizador (Ex: +2449...) " value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 text-slate-900" />
                    
                    <textarea placeholder="Descrição do Convite" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 text-slate-900" rows={3}></textarea>
                    
                    <Button onClick={handleSubmit} variant="navy" fullWidth disabled={isSaving}>
                        <Save size={20} className="mr-2" /> {isSaving ? "Salvando..." : "Salvar e Visualizar"}
                    </Button>
                </div>
            </div>
        </div>
    );
};
