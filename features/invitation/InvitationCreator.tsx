import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { QRCodeSVG } from 'qrcode.react'; 
import { Save, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const InvitationCreator: React.FC = () => {
    const navigate = useNavigate();
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
    
    const handleSubmit = () => {
        if (!formData.groomName || !formData.brideName || !formData.date || !formData.time || !formData.location || !formData.iban || !formData.accountName || !formData.bankName) {
            alert('Por favor, preencha todos os campos obrigatórios!');
            return;
        }

        const finalData = { 
            ...formData, 
            title: `${formData.groomName} & ${formData.brideName}` 
        };
        sessionStorage.setItem('createdEventData', JSON.stringify(finalData));
        navigate('/invite/created');
    }
    
    return (
        <div className="min-h-screen bg-slate-50 p-6 font-display">
            <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h1 className="text-2xl font-bold text-brand-blue mb-6">Criar Convite - Plano Essencial</h1>
                
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
                    
                    <Button onClick={handleSubmit} variant="navy" fullWidth>
                        <Save size={20} className="mr-2" /> Salvar e Visualizar
                    </Button>
                </div>
            </div>
        </div>
    );
};
