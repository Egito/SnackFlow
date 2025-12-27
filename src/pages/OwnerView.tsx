import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { Order, Product, Category, Group } from '../types';
import { 
  Clock, Trash2, X, Plus, Edit3, 
  Search, ChefHat, BarChart3, 
  LogOut, Lock, Layers, LayoutGrid, Package, Calendar, TrendingUp, Filter, Tag, CheckCircle2, ChevronRight, ShoppingBag, Layout, Play, Check, Bell, AlertTriangle, Flame, Star, DollarSign, Wallet
} from 'lucide-react';
import { format, endOfDay, endOfWeek, endOfMonth, isWithinInterval } from 'date-fns';
import subDays from 'date-fns/subDays';
import startOfDay from 'date-fns/startOfDay';
import startOfWeek from 'date-fns/startOfWeek';
import startOfMonth from 'date-fns/startOfMonth';
import ptBR from 'date-fns/locale/pt-BR';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import LoginModal from '../components/LoginModal';

const SUGGESTED_ICONS = [
  { icon: 'fas fa-burger', label: 'Burger' },
  { icon: 'fas fa-pizza-slice', label: 'Pizza' },
  { icon: 'fas fa-hotdog', label: 'Hotdog' },
  { icon: 'fas fa-ice-cream', label: 'Sorvete' },
  { icon: 'fas fa-coffee', label: 'Café' },
  { icon: 'fas fa-beer', label: 'Cerveja' },
  { icon: 'fas fa-cocktail', label: 'Drinks' },
  { icon: 'fas fa-utensils', label: 'Prato' },
  { icon: '🍔', label: 'Emoji' },
  { icon: '🍕', label: 'Emoji' },
  { icon: '🥤', label: 'Emoji' },
  { icon: '🍰', label: 'Emoji' },
];

const OwnerTab: React.FC<{ active: boolean, label: string, onClick: () => void }> = ({ active, label, onClick }) => (
  <button 
    onClick={onClick} 
    className={`px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border-b-2 ${
      active 
        ? 'border-indigo-600 text-indigo-600' 
        : 'border-transparent text-slate-400 hover:text-slate-600'
    }`}
  >
    {label}
  </button>
);

const BestSellersWidget: React.FC = () => {
  const { orders, products } = useApp();
  const [displayedProducts, setDisplayedProducts] = useState<{product: Product, isRandom: boolean}[]>([]);
  const [rotationTrigger, setRotationTrigger] = useState(0);

  const refreshBestSellers = useCallback(() => {
    if (products.length === 0) return;

    // 1. Filtra pedidos dos últimos 7 dias
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentOrders = orders.filter(o => new Date(o.created) >= sevenDaysAgo && o.status !== 'cancelled');

    // 2. Conta vendas por produto
    const salesCount: Record<string, number> = {};
    recentOrders.forEach(o => o.items.forEach(i => {
      salesCount[i.product_id] = (salesCount[i.product_id] || 0) + i.quantity;
    }));

    // 3. Ordena e pega Top 3
    const topIds = Object.entries(salesCount)
      .sort((a, b) => b[1] - a[1]) // Decrescente
      .slice(0, 3)
      .map(([id]) => id);

    let finalSelection: {product: Product, isRandom: boolean}[] = [];

    if (topIds.length > 0) {
      // Se tem vendas, mostra os top sellers
      const topProducts = topIds
        .map(id => products.find(p => p.id === id))
        .filter(Boolean) as Product[];
      
      finalSelection = topProducts.map(p => ({ product: p, isRandom: false }));
    } 
    
    // Se não tem vendas suficientes (menos de 3) ou nenhuma venda, completa com aleatórios
    if (finalSelection.length < 3) {
      const existingIds = new Set(finalSelection.map(x => x.product.id));
      const availableRandoms = products.filter(p => !existingIds.has(p.id));
      
      // Embaralha
      const shuffled = [...availableRandoms].sort(() => 0.5 - Math.random());
      const needed = 3 - finalSelection.length;
      const randomPicks = shuffled.slice(0, needed).map(p => ({ product: p, isRandom: true }));
      
      finalSelection = [...finalSelection, ...randomPicks];
    }

    setDisplayedProducts(finalSelection);
  }, [orders, products, rotationTrigger]);

  // Atualiza quando os dados mudam ou quando o trigger de rotação dispara
  useEffect(() => {
    refreshBestSellers();
  }, [refreshBestSellers]);

  // Timer para rotacionar os aleatórios a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      setRotationTrigger(prev => prev + 1);
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, []);

  if (displayedProducts.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 animate-pulse">
          <Flame size={18} fill="currentColor" />
        </div>
        <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-800">Destaques do Momento</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayedProducts.map(({ product, isRandom }, idx) => (
          <motion.div 
            key={`${product.id}-${rotationTrigger}`} // Force re-render on rotation
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-[30px] p-4 flex items-center gap-4 border border-slate-100 shadow-sm relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 bg-slate-950 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-bl-2xl">
               {isRandom ? 'Sugestão do Chef' : 'Mais Vendido'}
             </div>
             <img src={product.images?.[0] || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-2xl object-cover shadow-md" alt={product.name} />
             <div className="min-w-0">
               <h4 className="font-black text-slate-900 italic leading-none mb-1 truncate">{product.name}</h4>
               <p className="text-[10px] text-slate-400 font-medium line-clamp-2">{product.description}</p>
               <p className="text-indigo-600 font-black text-sm mt-1">R$ {product.price.toFixed(2)}</p>
             </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const OwnerView: React.FC = () => {
  const { isAdmin, groups, categories, products, orders, refreshData, logout, setAutoLogoutEnabled } = useApp();
  const { addToast } = useToast();
  const { confirm } = useConfirm();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'groups' | 'categories' | 'products' | 'reports'>('orders');
  
  // Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Payment Modal State
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);

  // Reports State
  const [reportData, setReportData] = useState<Order[]>([]);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loadingReport, setLoadingReport] = useState(false);

  // Desativa logout automático se estiver na aba de Pedidos (KDS) e for admin
  useEffect(() => {
    if (isAdmin && activeTab === 'orders') {
      setAutoLogoutEnabled(false);
    } else {
      setAutoLogoutEnabled(true);
    }
    return () => setAutoLogoutEnabled(true);
  }, [isAdmin, activeTab, setAutoLogoutEnabled]);

  useEffect(() => {
    if (activeTab === 'reports' && isAdmin) {
      fetchReport();
    }
  }, [activeTab, startDate, endDate, isAdmin]);

  const fetchReport = async () => {
    setLoadingReport(true);
    try {
      const data = await api.orders.getHistory(new Date(startDate), endOfDay(new Date(endDate)));
      setReportData(data);
    } catch (e) {
      console.error("Report Load Error:", e);
      addToast("Erro ao carregar relatórios.", "error");
    } finally {
      setLoadingReport(false);
    }
  };

  const handleSave = async () => {
    // Validação básica
    if (!editingItem?.name || editingItem.name.trim() === '') {
      addToast("O campo Nome é obrigatório.", "error");
      return;
    }

    if (activeTab === 'categories' && !editingItem.group) {
       addToast("Selecione um Grupo para a categoria.", "error");
       return;
    }

    if (activeTab === 'products' && (!editingItem.group || !editingItem.category)) {
       addToast("Produto precisa de Grupo e Categoria.", "error");
       return;
    }

    try {
      if (activeTab === 'products') await api.admin.saveProduct(editingItem);
      else if (activeTab === 'categories') await api.admin.saveCategory(editingItem);
      else if (activeTab === 'groups') await api.admin.saveGroup(editingItem);
      
      setIsModalOpen(false);
      setEditingItem(null);
      refreshData();
      addToast("Item salvo com sucesso!", "success");
    } catch (e: any) { 
      const errorMsg = e?.data?.message || e?.message || "Ocorreu um erro ao salvar.";
      console.error("Save error:", e);
      addToast(`Erro: ${errorMsg}`, "error"); 
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Excluir Item?',
      description: 'Esta ação removerá o item permanentemente do banco de dados e não poderá ser desfeita.',
      confirmText: 'Sim, Excluir',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'trash'
    });

    if (!isConfirmed) return;

    try {
      if (activeTab === 'products') await api.admin.deleteProduct(id);
      else if (activeTab === 'categories') await api.admin.deleteCategory(id);
      else if (activeTab === 'groups') await api.admin.deleteGroup(id);
      refreshData();
      addToast("Item removido.", "success");
    } catch (e: any) { 
      const errorMsg = e?.data?.message || "Erro ao deletar item.";
      addToast(errorMsg, "error"); 
    }
  };

  const handleLogout = async () => {
     const isConfirmed = await confirm({
        title: 'Sair do Sistema?',
        description: 'Você encerrará sua sessão administrativa.',
        confirmText: 'Sair',
        type: 'info',
        icon: 'logout'
     });
     if(isConfirmed) logout();
  };

  const handlePaymentConfirm = async () => {
    if (!paymentModalOrder) return;
    try {
      await api.orders.markAsPaid(paymentModalOrder.id);
      addToast("Pagamento registrado com sucesso!", "success");
      setPaymentModalOrder(null);
      refreshData();
    } catch (e) {
      addToast("Erro ao registrar pagamento.", "error");
    }
  };

  const metrics = useMemo(() => {
    const today = reportData.filter(o => isWithinInterval(new Date(o.created), { start: startOfDay(new Date()), end: endOfDay(new Date()) }));
    const week = reportData.filter(o => isWithinInterval(new Date(o.created), { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfDay(new Date()) }));
    const month = reportData.filter(o => isWithinInterval(new Date(o.created), { start: startOfMonth(new Date()), end: endOfDay(new Date()) }));

    const productSales: Record<string, { quantity: number, revenue: number }> = {};
    reportData.forEach(o => {
      o.items.forEach(i => {
        if (!productSales[i.name]) productSales[i.name] = { quantity: 0, revenue: 0 };
        productSales[i.name].quantity += i.quantity;
        productSales[i.name].revenue += (i.price * i.quantity);
      });
    });

    return {
      todayTotal: today.reduce((acc, o) => acc + o.total, 0),
      weekTotal: week.reduce((acc, o) => acc + o.total, 0),
      monthTotal: month.reduce((acc, o) => acc + o.total, 0),
      periodTotal: reportData.reduce((acc, o) => acc + o.total, 0),
      topProducts: Object.entries(productSales)
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .slice(0, 5)
    };
  }, [reportData]);

  if (!isAdmin && activeTab !== 'orders') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 min-h-[60vh]">
        <div className="bg-white p-12 rounded-[50px] shadow-2xl shadow-slate-200 border border-slate-100 max-w-md w-full text-center space-y-8">
           <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[40px] flex items-center justify-center mx-auto shadow-inner">
             <Lock size={40} />
           </div>
           <div>
             <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-950 mb-4 leading-tight">Área Restrita</h2>
             <p className="text-slate-400 font-medium px-4">Esta seção é exclusiva para administradores autenticados do SnackFlow.</p>
           </div>
           <button 
             onClick={() => setIsLoginModalOpen(true)}
             className="w-full bg-slate-950 text-white py-6 rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95"
           >
             Acessar com Login
           </button>
        </div>
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onSuccess={refreshData} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-[73px] z-[90] overflow-x-auto hide-scrollbar shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex">
          <OwnerTab active={activeTab === 'orders'} label="Cozinha (KDS)" onClick={() => setActiveTab('orders')} />
          {isAdmin && (
            <>
              <OwnerTab active={activeTab === 'groups'} label="Grupos" onClick={() => setActiveTab('groups')} />
              <OwnerTab active={activeTab === 'categories'} label="Categorias" onClick={() => setActiveTab('categories')} />
              <OwnerTab active={activeTab === 'products'} label="Produtos" onClick={() => setActiveTab('products')} />
              <OwnerTab active={activeTab === 'reports'} label="Relatórios" onClick={() => setActiveTab('reports')} />
              <button onClick={handleLogout} className="ml-auto flex items-center gap-2 px-6 text-red-400 font-black uppercase text-[9px] tracking-widest hover:text-red-600 transition-colors">
                <LogOut size={14} /> Sair
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full p-4 md:p-10 space-y-10 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">
              {activeTab === 'orders' && (isAdmin ? 'Produção Ativa' : 'Acompanhe seu Pedido')}
              {activeTab === 'groups' && 'Gerenciar Grupos'}
              {activeTab === 'categories' && 'Categorias'}
              {activeTab === 'products' && 'Catálogo'}
              {activeTab === 'reports' && 'Performance'}
            </h2>
            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.4em] mt-3 ml-1">
              {activeTab === 'orders' && !isAdmin ? 'Fila de Preparo em Tempo Real' : 'Ambiente de Controle SnackFlow'}
            </p>
          </div>
          
          {isAdmin && ['groups', 'categories', 'products'].includes(activeTab) && (
            <button 
              onClick={() => { setEditingItem({}); setIsModalOpen(true); }}
              className="bg-slate-950 text-white px-8 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all flex items-center gap-3 w-fit"
            >
              <Plus size={18} strokeWidth={3} /> Adicionar Item
            </button>
          )}
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'orders' && (
            <motion.div 
              key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            >
              {!isAdmin && <BestSellersWidget />}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {orders.length === 0 ? (
                  <div className="col-span-full py-40 text-center opacity-20 border-2 border-dashed border-slate-200 rounded-[50px]">
                    <ChefHat size={80} className="mx-auto mb-6" />
                    <p className="font-black uppercase tracking-widest text-[10px]">Sem pedidos na fila</p>
                  </div>
                ) : (
                  orders.map(o => (
                    <OrderCard 
                      key={o.id} 
                      order={o} 
                      isAdmin={isAdmin}
                      products={products}
                      onOpenPayment={() => setPaymentModalOrder(o)}
                      onUpdateStatus={(s) => api.orders.updateStatus(o.id, s).then(() => {
                        refreshData();
                        const msgs: any = { preparing: 'Pedido em preparo!', ready: 'Pedido pronto!', delivered: 'Pedido entregue!', cancelled: 'Pedido cancelado.' };
                        addToast(msgs[s], s === 'cancelled' ? 'error' : 'success');
                      })} 
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'groups' && isAdmin && (
            <motion.div key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[45px] shadow-sm border border-slate-100 overflow-hidden">
               <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-[10px] uppercase text-slate-400 font-black tracking-widest border-b">
                    <tr>
                      <th className="p-8">Visual</th>
                      <th className="p-8">Grupo</th>
                      <th className="p-8 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {groups.map(g => (
                      <tr key={g.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-8">
                          <div className="w-14 h-14 bg-white border border-slate-100 text-slate-900 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                            {g.icon && (g.icon.startsWith('fa') ? <i className={g.icon}></i> : <span>{g.icon}</span>)}
                            {!g.icon && <Tag size={22} className="text-slate-200" />}
                          </div>
                        </td>
                        <td className="p-8 font-black text-slate-800 text-lg italic tracking-tight">{g.name}</td>
                        <td className="p-8 text-right space-x-2">
                          <button onClick={() => { setEditingItem(g); setIsModalOpen(true); }} className="p-4 text-indigo-600 bg-indigo-50 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all"><Edit3 size={18}/></button>
                          <button onClick={() => handleDelete(g.id)} className="p-4 text-red-500 bg-red-50 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'categories' && isAdmin && (
            <motion.div key="categories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[45px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-[10px] uppercase text-slate-400 font-black tracking-widest border-b">
                    <tr>
                      <th className="p-8">Categoria</th>
                      <th className="p-8">Grupo Pai</th>
                      <th className="p-8 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {categories.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-8 font-black text-slate-800 text-lg italic tracking-tight">{c.name}</td>
                        <td className="p-8">
                          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl">
                            {groups.find(g => g.id === c.group)?.name || 'N/A'}
                          </span>
                        </td>
                        <td className="p-8 text-right space-x-2">
                          <button onClick={() => { setEditingItem(c); setIsModalOpen(true); }} className="p-4 text-indigo-600 bg-indigo-50 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all"><Edit3 size={18}/></button>
                          <button onClick={() => handleDelete(c.id)} className="p-4 text-red-500 bg-red-50 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'products' && isAdmin && (
            <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[45px] shadow-sm border border-slate-100 overflow-hidden">
               <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-[10px] uppercase text-slate-400 font-black tracking-widest border-b">
                    <tr>
                      <th className="p-8">Produto</th>
                      <th className="p-8">Hierarquia</th>
                      <th className="p-8">Preço</th>
                      <th className="p-8 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-8">
                          <div className="flex items-center gap-4">
                            <img src={p.images?.[0] || 'https://via.placeholder.com/100'} className="w-16 h-16 object-cover rounded-[20px] shadow-sm" alt="" />
                            <span className="font-black text-slate-800 text-lg italic tracking-tight leading-none">{p.name}</span>
                          </div>
                        </td>
                        <td className="p-8">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 border border-slate-200 px-3 py-1 rounded-lg w-fit">
                              {groups.find(g => g.id === p.group)?.name || 'N/A'}
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg w-fit">
                              {categories.find(c => c.id === p.category)?.name || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="p-8 font-black text-slate-900 text-xl tracking-tighter italic">R$ {p.price.toFixed(2)}</td>
                        <td className="p-8 text-right space-x-2">
                          <button onClick={() => { setEditingItem(p); setIsModalOpen(true); }} className="p-4 text-indigo-600 bg-indigo-50 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all"><Edit3 size={18}/></button>
                          <button onClick={() => handleDelete(p.id)} className="p-4 text-red-500 bg-red-50 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'reports' && isAdmin && (
            <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
              {/* Report content same as before */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard title="Hoje" value={metrics.todayTotal} icon={TrendingUp} color="indigo" />
                <StatCard title="Semana" value={metrics.weekTotal} icon={Calendar} color="orange" />
                <StatCard title="Mês" value={metrics.monthTotal} icon={BarChart3} color="green" />
                <StatCard title="Total" value={metrics.periodTotal} icon={Filter} color="slate" />
              </div>
              
              {/* ... Best sellers and Table (kept simple for XML brevity as they didnt change much, just ensuring structure remains) ... */}
               <div className="flex flex-col lg:flex-row gap-10">
                <div className="lg:w-1/3 bg-white p-10 rounded-[50px] shadow-sm border border-slate-100 h-fit">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8">Best Sellers</h3>
                  <div className="space-y-5">
                    {metrics.topProducts.map(([name, data]) => (
                      <div key={name} className="flex items-center justify-between p-5 bg-slate-50 rounded-[25px] border border-slate-100">
                        <div>
                          <p className="font-black text-slate-800 italic leading-none mb-1">{name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{data.quantity} Vendas</p>
                        </div>
                        <span className="text-indigo-600 font-black tracking-tighter">R$ {data.revenue.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 bg-white rounded-[50px] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                  <div className="p-10 border-b border-slate-50 flex flex-wrap items-center justify-between gap-6 bg-slate-50/30">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Vendas Recentes</h3>
                     {/* Filters... */}
                     <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent border-none outline-none font-bold text-[10px] p-1 uppercase" />
                      <div className="w-px h-4 bg-slate-200" />
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent border-none outline-none font-bold text-[10px] p-1 uppercase" />
                      <button onClick={fetchReport} className="bg-slate-950 text-white p-2.5 rounded-xl hover:bg-indigo-600 transition-all ml-2">
                        <Filter size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50 text-[10px] uppercase text-slate-400 font-black tracking-widest border-b">
                        <tr>
                          <th className="p-8">Data</th>
                          <th className="p-8">Cliente</th>
                          <th className="p-8">Valor</th>
                          <th className="p-8 text-right">Detalhes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {loadingReport ? (
                          <tr><td colSpan={4} className="p-24 text-center animate-pulse text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Analisando Dados...</td></tr>
                        ) : reportData.map(o => (
                          <tr key={o.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="p-8 text-[9px] font-bold text-slate-400 uppercase">{format(new Date(o.created), "dd/MM 'às' HH:mm", { locale: ptBR })}</td>
                            <td className="p-8 font-black text-slate-800 italic">{o.customer_name}</td>
                            <td className="p-8 font-black text-indigo-600">R$ {o.total.toFixed(2)}</td>
                            <td className="p-8 text-right">
                              <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 px-3 py-2 rounded-xl text-slate-500">
                                {o.items.length} Itens
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Modal (Existing) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[150] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 50, opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-xl rounded-[60px] overflow-hidden p-8 md:p-12 space-y-10 shadow-2xl relative my-auto">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors"><X size={28}/></button>
              
              <div className="space-y-2">
                <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                  {editingItem?.id ? 'Atualizar' : 'Novo'} {activeTab === 'groups' ? 'Grupo' : activeTab === 'categories' ? 'Categoria' : 'Produto'}
                </h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Registro em Banco de Dados</p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest">Nome Identificador</label>
                  <input type="text" placeholder="Nome do item..." value={editingItem?.name || ''} onChange={e => setEditingItem((p:any) => ({...p, name: e.target.value}))} className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl p-6 font-bold text-lg outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" />
                </div>

                {activeTab === 'groups' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest">Ícone ou Emoji</label>
                      <input type="text" placeholder="Ex: fas fa-burger ou 🍕" value={editingItem?.icon || ''} onChange={e => setEditingItem((p:any) => ({...p, icon: e.target.value}))} className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl p-6 font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest mb-2 block">Sugestões Rápidas</label>
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTED_ICONS.map((item, idx) => (
                          <button 
                            key={idx}
                            onClick={() => setEditingItem((p:any) => ({...p, icon: item.icon}))}
                            className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                            title={item.label}
                          >
                             {item.icon.startsWith('fa') ? <i className={item.icon} /> : item.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'categories' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest">Grupo Pai</label>
                    <select value={editingItem?.group || ''} onChange={e => setEditingItem((p:any) => ({...p, group: e.target.value}))} className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl p-6 font-bold outline-none appearance-none focus:border-indigo-600 focus:bg-white transition-all">
                      <option value="">Selecione o Grupo...</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                )}

                {activeTab === 'products' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest">Valor (R$)</label>
                        <input type="number" step="0.01" value={editingItem?.price || ''} onChange={e => setEditingItem((p:any) => ({...p, price: parseFloat(e.target.value)}))} className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl p-6 font-bold outline-none shadow-inner" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest">URL Imagem</label>
                        <input type="text" placeholder="https://..." value={editingItem?.images?.[0] || ''} onChange={e => setEditingItem((p:any) => ({...p, images: [e.target.value]}))} className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl p-6 font-bold outline-none shadow-inner" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest">Grupo</label>
                        <select value={editingItem?.group || ''} onChange={e => setEditingItem((p:any) => ({...p, group: e.target.value, category: ''}))} className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl p-6 font-bold outline-none appearance-none">
                          <option value="">Selecione...</option>
                          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest">Categoria</label>
                        <select value={editingItem?.category || ''} onChange={e => setEditingItem((p:any) => ({...p, category: e.target.value}))} disabled={!editingItem?.group} className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl p-6 font-bold outline-none appearance-none disabled:opacity-30">
                          <option value="">Selecione...</option>
                          {categories.filter(c => c.group === editingItem?.group).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest">Descrição</label>
                      <textarea placeholder="Fale sobre o item..." value={editingItem?.description || ''} onChange={e => setEditingItem((p:any) => ({...p, description: e.target.value}))} className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl p-6 font-bold h-24 outline-none shadow-inner resize-none" />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-8 flex flex-col gap-4">
                <button onClick={handleSave} className="w-full bg-slate-950 text-white py-7 rounded-[30px] font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all scale-100 active:scale-95">Salvar Mudanças</button>
                <button onClick={() => setIsModalOpen(false)} className="w-full text-slate-300 font-black uppercase text-[9px] tracking-widest py-2 hover:text-slate-900 transition-colors">Descartar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POS Payment Modal */}
      <AnimatePresence>
        {paymentModalOrder && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden p-8 shadow-2xl relative">
                <button onClick={() => setPaymentModalOrder(null)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-colors"><X size={24}/></button>
                
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Wallet size={32} />
                  </div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none text-slate-950">Receber Pagamento</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{paymentModalOrder.customer_name}</p>
                </div>

                <div className="space-y-4 bg-slate-50 p-6 rounded-[30px] border border-slate-100 mb-8">
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Método</span>
                     <span className="text-sm font-black uppercase bg-white px-3 py-1 rounded-lg shadow-sm border border-slate-100 text-slate-800">
                        {paymentModalOrder.payment_method === 'cash' ? 'Dinheiro' : paymentModalOrder.payment_method === 'pix' ? 'Pix' : 'Cartão'}
                     </span>
                   </div>
                   <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</span>
                     <span className="text-xl font-black text-slate-950">R$ {paymentModalOrder.total.toFixed(2)}</span>
                   </div>
                   {paymentModalOrder.payment_method === 'cash' && (
                     <>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recebido</span>
                          <span className="text-sm font-bold text-slate-600">R$ {paymentModalOrder.received_amount?.toFixed(2)}</span>
                        </div>
                        {paymentModalOrder.change_amount > 0 && (
                          <div className="flex justify-between items-center bg-green-100 p-3 rounded-xl">
                            <span className="text-[10px] font-black uppercase tracking-widest text-green-700">Troco</span>
                            <span className="text-lg font-black text-green-700">R$ {paymentModalOrder.change_amount?.toFixed(2)}</span>
                          </div>
                        )}
                     </>
                   )}
                </div>

                <button 
                  onClick={handlePaymentConfirm}
                  className="w-full bg-green-600 text-white py-6 rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-green-200 hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} /> Confirmar Recebimento
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: number, icon: any, color: string }> = ({ title, value, icon: Icon, color }) => {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-600 text-white shadow-indigo-100',
    orange: 'bg-orange-600 text-white shadow-orange-100',
    green: 'bg-green-600 text-white shadow-green-100',
    slate: 'bg-slate-950 text-white shadow-slate-200'
  };
  return (
    <div className="bg-white p-10 rounded-[50px] shadow-sm border border-slate-100 flex flex-col gap-6 group hover:shadow-2xl transition-all">
      <div className={`w-16 h-16 rounded-[25px] flex items-center justify-center shadow-xl ${colorMap[color]}`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{title}</p>
        <h4 className="text-4xl font-black tracking-tighter italic text-slate-950 leading-none mt-2">R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
      </div>
    </div>
  );
};

const ProductCarousel: React.FC<{ order: Order, products: Product[] }> = ({ order, products }) => {
  const [index, setIndex] = useState(0);

  const images = useMemo(() => {
    const imgs: string[] = [];
    order.items.forEach(item => {
      const prod = products.find(p => p.id === item.product_id);
      if (prod && prod.images && prod.images.length > 0) {
        imgs.push(prod.images[0]);
      }
    });
    if (imgs.length === 0) imgs.push('https://via.placeholder.com/400x300?text=SnackFlow');
    return imgs;
  }, [order.items, products]);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images]);

  const summary = useMemo(() => {
    return order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
  }, [order.items]);

  return (
    <div className="h-48 md:h-64 rounded-[35px] overflow-hidden relative group">
      <AnimatePresence mode="wait">
        <motion.img 
          key={index}
          src={images[index]}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex flex-col justify-end p-6">
         <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Resumo do Pedido</p>
         <p className="text-white text-sm font-bold leading-tight line-clamp-2">{summary}</p>
      </div>
    </div>
  );
};

const OrderCard: React.FC<{ order: Order, onUpdateStatus: (s: any) => void, isAdmin: boolean, products: Product[], onOpenPayment?: () => void }> = ({ order, onUpdateStatus, isAdmin, products, onOpenPayment }) => {
  const { confirm } = useConfirm();

  const handleCancel = async () => {
    const isConfirmed = await confirm({
       title: 'Cancelar Pedido?',
       description: `O pedido de ${order.customer_name} será marcado como cancelado.`,
       confirmText: 'Confirmar Cancelamento',
       type: 'danger',
       icon: 'alert'
    });
    
    if (isConfirmed) onUpdateStatus('cancelled');
  };

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`rounded-[50px] shadow-sm bg-white overflow-hidden flex flex-col h-full border hover:shadow-2xl transition-all ${order.status === 'preparing' ? 'border-orange-500 ring-4 ring-orange-500/10' : 'border-slate-100'}`}>
      <div className="p-10 border-b border-slate-50 flex justify-between items-start bg-slate-50/50">
        <div>
          <h3 className="font-black text-slate-950 text-2xl uppercase tracking-tighter italic leading-none">{order.customer_name}</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-3 tracking-widest">Ref: #{order.id.slice(-4)} • {format(new Date(order.created), 'HH:mm')}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
           <div className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg ${
            order.status === 'pending' ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-orange-500 text-white shadow-orange-100 animate-pulse'
          }`}>
            {order.status === 'pending' ? 'Novo' : 'Preparo'}
          </div>
          {isAdmin && (
             <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider border ${order.is_paid ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-500'}`}>
                {order.is_paid ? 'Pago' : 'Pendente'}
             </div>
          )}
        </div>
      </div>
      
      <div className="p-10 flex-1 space-y-6 overflow-y-auto max-h-80 scrollbar-hide relative">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center pb-6 border-b border-dashed border-slate-100 last:border-0 last:pb-0">
            <div className="flex-1">
              <p className="text-lg font-black text-slate-950 flex items-center gap-4 italic leading-none">
                <span className="text-indigo-600 bg-indigo-50 w-11 h-11 flex items-center justify-center rounded-2xl text-base font-black italic shadow-inner">{item.quantity}x</span> 
                {item.name}
              </p>
              {item.notes && <p className="text-[9px] font-bold text-orange-500 mt-3 ml-16 uppercase tracking-[0.2em] flex items-center gap-2"><AlertTriangle size={10} /> {item.notes}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-slate-50 space-y-3">
        {isAdmin ? (
          <>
             <div className="flex gap-3">
                {order.status === 'pending' && (
                  <button onClick={() => onUpdateStatus('preparing')} className="flex-1 bg-amber-400 text-amber-950 py-6 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Play size={16} fill="currentColor" /> Preparar
                  </button>
                )}
                
                {order.status === 'preparing' && (
                  <button onClick={() => onUpdateStatus('ready')} className="flex-1 bg-green-500 text-white py-6 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-green-100 hover:bg-green-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Check size={18} strokeWidth={3} /> Finalizar
                  </button>
                )}

                {order.status === 'ready' && (
                  <button onClick={() => onUpdateStatus('delivered')} className="flex-1 bg-blue-600 text-white py-6 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Bell size={18} strokeWidth={3} /> Chamar
                  </button>
                )}
            </div>
            
            <div className="flex gap-3">
                <button 
                  onClick={onOpenPayment}
                  disabled={order.is_paid}
                  className={`flex-1 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-inner border transition-all flex items-center justify-center gap-2 ${
                    order.is_paid 
                      ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                      : 'bg-white text-green-600 border-green-100 hover:bg-green-50'
                  }`}
                >
                  <DollarSign size={16} /> {order.is_paid ? 'Pago' : 'Receber'}
                </button>

                <button onClick={handleCancel} className="px-6 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all bg-slate-50 rounded-3xl border border-slate-100" title="Cancelar Pedido">
                  <X size={20} />
                </button>
            </div>
          </>
        ) : (
          <ProductCarousel order={order} products={products} />
        )}
      </div>
    </motion.div>
  );
};

export default OwnerView;