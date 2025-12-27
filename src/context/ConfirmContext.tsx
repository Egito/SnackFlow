import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, LogOut, CheckCircle2, X } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'success';
  icon?: 'trash' | 'logout' | 'check' | 'alert';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ title: '', description: '' });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions({
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      type: 'info',
      icon: 'alert',
      ...opts
    });
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleClose = (value: boolean) => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(value);
      resolveRef.current = null;
    }
  };

  const getIcon = () => {
    switch (options.icon) {
      case 'trash': return <Trash2 size={32} className="text-red-500" />;
      case 'logout': return <LogOut size={32} className="text-orange-500" />;
      case 'check': return <CheckCircle2 size={32} className="text-green-500" />;
      default: return <AlertTriangle size={32} className="text-indigo-500" />;
    }
  };

  const getColor = () => {
    switch (options.type) {
      case 'danger': return 'bg-red-500 shadow-red-200 hover:bg-red-600';
      case 'success': return 'bg-green-500 shadow-green-200 hover:bg-green-600';
      default: return 'bg-slate-900 shadow-slate-200 hover:bg-slate-800';
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl border border-white/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => handleClose(false)} className="text-slate-300 hover:text-slate-500 transition-colors"><X size={24} /></button>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-[30px] flex items-center justify-center mb-6 shadow-inner bg-slate-50 border border-slate-100`}>
                  {getIcon()}
                </div>
                
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-3 leading-none">
                  {options.title}
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-8 px-4">
                  {options.description}
                </p>

                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => handleClose(false)}
                    className="flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                  >
                    {options.cancelText}
                  </button>
                  <button 
                    onClick={() => handleClose(true)}
                    className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white shadow-xl transition-all active:scale-95 ${getColor()}`}
                  >
                    {options.confirmText}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm deve ser usado dentro de ConfirmProvider");
  return context;
};