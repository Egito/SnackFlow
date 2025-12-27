import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock } from 'lucide-react';
import { login } from '../services/pocketbase';
import { useToast } from '../context/ToastContext';
import { DEFAULT_ADMIN_EMAIL } from '../services/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  
  // Recupera o email padrão das configurações globais
  const defaultEmail = DEFAULT_ADMIN_EMAIL;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);
    try { 
      await login(email, password); 
      addToast('Acesso administrativo concedido.', 'success');
      onSuccess(); 
      onClose(); 
    } catch (e) { 
      addToast('Credenciais inválidas ou erro de conexão.', 'error');
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/90 z-[200] flex items-center justify-center p-6 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-sm rounded-[60px] p-16 text-center relative shadow-2xl"
          >
            <button onClick={onClose} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors">
              <X size={28}/>
            </button>
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-inner">
              <Lock size={40} />
            </div>
            <h2 className="text-3xl font-black italic uppercase mb-2 tracking-tighter text-slate-950">Acesso Master</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em] mb-12">Portal do Proprietário</p>
            <form onSubmit={handleLogin} className="space-y-5">
              <input 
                type="email" 
                placeholder="E-mail Operacional" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl p-6 font-bold outline-none focus:border-indigo-600 transition-all" 
                required 
                autoComplete="email"
              />
              <input 
                type="password" 
                placeholder="Chave de Acesso" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl p-6 font-bold outline-none focus:border-indigo-600 transition-all" 
                required 
                autoComplete="current-password"
              />
              <button className="w-full bg-slate-950 text-white py-6 rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all scale-100 active:scale-95">
                {loading ? 'Validando...' : 'Entrar Agora'}
              </button>
            </form>
            <div className="mt-12 pt-8 border-t border-slate-100 text-center">
               <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em]">Credencial Principal</p>
               <p className="text-xs font-bold text-slate-500 mt-2">{defaultEmail}</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;