import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, DownloadCloud } from 'lucide-react';
import { useApp } from '../context/AppContext';

const UpdateNotifier: React.FC = () => {
  const { updateAvailable } = useApp();

  const handleReload = () => {
    window.location.reload();
  };
  
  if (!updateAvailable) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-[200] w-full max-w-sm"
      >
        <div className="bg-slate-900 text-white p-6 rounded-[30px] shadow-2xl border border-slate-800 flex flex-col gap-4 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/50 animate-pulse">
                <DownloadCloud size={24} className="text-white" />
              </div>
              <div>
                <h4 className="font-black uppercase italic text-lg leading-none mb-1">Nova Versão</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Atualização Disponível</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-300 font-medium leading-relaxed relative z-10">
            Uma nova versão do SnackFlow foi publicada. Atualize para receber as últimas melhorias.
          </p>

          <button 
            onClick={handleReload}
            className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-orange-500 hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 relative z-10"
          >
            <RefreshCw size={16} strokeWidth={3} />
            Atualizar Agora
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpdateNotifier;