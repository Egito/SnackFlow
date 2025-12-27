import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ConfirmProvider, useConfirm } from './context/ConfirmContext';
import CustomerView from './pages/CustomerView';
import OwnerView from './pages/OwnerView';
import LoginModal from './components/LoginModal';
import UpdateNotifier from './components/UpdateNotifier';
import { LayoutDashboard, Utensils, Lock, Unlock, ChefHat, Sparkles, AlertTriangle, CheckCircle2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASS } from './services/api';

const INACTIVITY_LIMIT = 10 * 60 * 1000; 

const SetupScreen: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 relative overflow-hidden font-sans">
       <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.15),transparent_40%)]" />
       
       <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-xl w-full bg-slate-900 rounded-[40px] p-10 md:p-14 shadow-2xl border border-slate-800 relative z-10 text-center">
          <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-orange-900/50">
            <AlertTriangle size={36} className="text-white animate-pulse" />
          </div>
          
          <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Configuração Inicial</h1>
          <p className="text-slate-400 font-medium leading-relaxed mb-8">
            Para garantir a segurança do sistema, o PocketBase exige que o primeiro <strong>Superusuário (Admin)</strong> seja criado manualmente.
          </p>

          <div className="bg-slate-950 rounded-[30px] p-8 border border-slate-800 text-left space-y-6 mb-8">
             <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">1. Acesso ao Painel</p>
                <a href="http://localhost:8090/_/" target="_blank" rel="noopener noreferrer" className="block bg-indigo-600 text-white text-center py-4 rounded-xl font-black uppercase text-[11px] tracking-widest hover:bg-indigo-500 transition-all">
                  Abrir Painel Admin
                </a>
             </div>
             
             <div className="space-y-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">2. Use estas credenciais</p>
               
               <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800 group hover:border-slate-700 transition-all">
                 <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-slate-500 uppercase">E-mail</p>
                    <p className="font-mono text-indigo-400 truncate">{DEFAULT_ADMIN_EMAIL}</p>
                 </div>
                 <button onClick={() => copyToClipboard(DEFAULT_ADMIN_EMAIL, 'email')} className="p-2 text-slate-400 hover:text-white transition-colors">
                    {copied === 'email' ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                 </button>
               </div>

               <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800 group hover:border-slate-700 transition-all">
                 <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Senha</p>
                    <p className="font-mono text-indigo-400 truncate">{DEFAULT_ADMIN_PASS}</p>
                 </div>
                 <button onClick={() => copyToClipboard(DEFAULT_ADMIN_PASS, 'pass')} className="p-2 text-slate-400 hover:text-white transition-colors">
                    {copied === 'pass' ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                 </button>
               </div>
             </div>
          </div>

          <button 
             onClick={() => window.location.reload()}
             className="w-full bg-white text-slate-950 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-xl active:scale-95"
          >
            Já criei o admin, continuar
          </button>
       </motion.div>
    </div>
  );
};

const MainContent: React.FC = () => {
  const { isInitializing, isAdmin, logout, refreshData, isAutoLogoutEnabled, appVersion, updateAvailable, setupRequired } = useApp();
  const [view, setView] = useState<'customer' | 'owner'>('customer');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { addToast } = useToast();
  const { confirm } = useConfirm();
  const inactivityTimerRef = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    if (inactivityTimerRef.current) window.clearTimeout(inactivityTimerRef.current);
    
    if (isAdmin && view === 'owner' && isAutoLogoutEnabled) {
      inactivityTimerRef.current = window.setTimeout(() => {
        logout();
        setView('customer');
        addToast("Sessão expirada por inatividade.", "info");
      }, INACTIVITY_LIMIT);
    }
  }, [isAdmin, view, logout, isAutoLogoutEnabled, addToast]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const eventHandler = () => resetTimer();
    events.forEach(e => document.addEventListener(e, eventHandler));
    resetTimer();
    return () => {
      events.forEach(e => document.removeEventListener(e, eventHandler));
      if (inactivityTimerRef.current) window.clearTimeout(inactivityTimerRef.current);
    };
  }, [resetTimer]);

  const handleAuthClick = async () => {
    if (isAdmin) {
      const isConfirmed = await confirm({
        title: 'Encerrar Expediente?',
        description: 'Você sairá do modo administrativo e retornará ao cardápio de clientes. Deseja continuar?',
        confirmText: 'Sim, Sair',
        cancelText: 'Permanecer',
        type: 'info',
        icon: 'logout'
      });

      if (isConfirmed) {
        logout();
        setView('customer');
        addToast("Logout realizado com sucesso.", "info");
      }
    } else {
      setIsLoginOpen(true);
    }
  };

  const handleLoginSuccess = async () => {
    setView('owner');
    refreshData();
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 font-sans">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="rounded-full h-16 w-16 border-t-4 border-orange-500 mb-8"
        />
        <h1 className="text-2xl font-black text-white tracking-widest uppercase italic animate-pulse">SnackFlow</h1>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-4">Iniciando Sistema...</p>
      </div>
    );
  }

  // Intercepta e mostra tela de setup se necessário
  if (setupRequired) {
    return <SetupScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="sticky top-0 z-[100] bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
            <ChefHat size={22} className="text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="hidden sm:block font-black uppercase italic tracking-tighter text-slate-900 text-lg">SnackFlow</span>
              <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">v{appVersion}</span>
              {updateAvailable && (
                <motion.span 
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-indigo-600 text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  onClick={() => window.location.reload()}
                  title="Clique para atualizar"
                >
                  <Sparkles size={8} /> Update
                </motion.span>
              )}
            </div>
            {isAdmin && <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-green-600">Modo Administrador</span>}
          </div>
        </div>

        <nav className="flex items-center gap-1 md:gap-4 bg-slate-100 p-1 rounded-2xl">
          <button 
            onClick={() => setView('customer')}
            className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'customer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Utensils size={14} /> <span className="hidden xs:inline">Cardápio</span>
          </button>
          <button 
            onClick={() => setView('owner')}
            className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'owner' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutDashboard size={14} /> <span className="hidden xs:inline">Gestão</span>
          </button>
        </nav>

        <div className="flex items-center gap-2">
            <button 
              onClick={handleAuthClick}
              className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all cursor-pointer hover:shadow-md active:scale-95 ${isAdmin ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200'}`}
              title={isAdmin ? "Sair do modo Admin" : "Acesso Administrativo"}
            >
              {isAdmin ? <Unlock size={18} /> : <Lock size={18} />}
            </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {view === 'customer' ? <CustomerView /> : <OwnerView />}
      </main>

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onSuccess={handleLoginSuccess}
      />
      
      <UpdateNotifier />
    </div>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <ConfirmProvider>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ConfirmProvider>
  </ToastProvider>
);

export default App;