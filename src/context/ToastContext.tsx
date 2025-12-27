import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss após 10 segundos
    setTimeout(() => {
      removeToast(id);
    }, 10000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-24 right-4 z-[300] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence mode='popLayout'>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const styles = {
    success: 'bg-white border-l-4 border-green-500 text-slate-800 shadow-xl shadow-green-900/5',
    error: 'bg-white border-l-4 border-red-500 text-slate-800 shadow-xl shadow-red-900/5',
    info: 'bg-white border-l-4 border-indigo-500 text-slate-800 shadow-xl shadow-indigo-900/5',
  };

  const icons = {
    success: <CheckCircle2 size={20} className="text-green-500" />,
    error: <AlertCircle size={20} className="text-red-500" />,
    info: <Info size={20} className="text-indigo-500" />,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto p-5 rounded-2xl flex items-start gap-4 ${styles[toast.type]} relative overflow-hidden`}
    >
      <div className="mt-0.5 shrink-0">{icons[toast.type]}</div>
      <div className="flex-1 pr-6">
        <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-400 mb-1">
          {toast.type === 'error' ? 'Atenção' : toast.type === 'success' ? 'Sucesso' : 'Info'}
        </h4>
        <p className="text-sm font-bold leading-tight">{toast.message}</p>
      </div>
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-slate-300 hover:text-slate-900 transition-colors"
      >
        <X size={16} />
      </button>
      
      {/* Timer Bar Visual */}
      <motion.div 
        initial={{ width: '100%' }} 
        animate={{ width: '0%' }} 
        transition={{ duration: 10, ease: "linear" }}
        className={`absolute bottom-0 left-0 h-1 ${
          toast.type === 'success' ? 'bg-green-100' : toast.type === 'error' ? 'bg-red-100' : 'bg-indigo-100'
        }`} 
      />
    </motion.div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast deve ser usado dentro de um ToastProvider");
  return context;
};