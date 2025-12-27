import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Product, OrderItem, Order, PaymentMethod } from '../types';
import { 
  ShoppingBag, X, ChevronLeft, Plus, Minus, Search, 
  Clock, Star, CreditCard, Banknote, QrCode, Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import pb from '../services/pocketbase';
import { api } from '../services/api';

const CustomerView: React.FC = () => {
  const { groups, categories, products, refreshData } = useApp();
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Status Sync
  useEffect(() => {
    const lastOrderId = localStorage.getItem('last_order_id');
    if (lastOrderId) {
      api.orders.getOne(lastOrderId)
        .then(order => {
          if (!['delivered', 'cancelled'].includes(order.status)) {
            setActiveOrder(order);
            pb.collection('orders').subscribe(order.id, (e) => {
              if (e.action === 'update') setActiveOrder(e.record as unknown as Order);
            });
          }
        })
        .catch(() => localStorage.removeItem('last_order_id'));
    }
    return () => { pb.collection('orders').unsubscribe(); };
  }, []);

  const addToCart = (product: Product, quantity: number, notes?: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id && i.notes === notes);
      if (existing) {
        return prev.map(i => (i.product_id === product.id && i.notes === notes) ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.price, quantity, notes }];
    });
    setSelectedProduct(null);
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGroup = activeGroup === 'all' || p.group === activeGroup;
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      return matchesSearch && matchesGroup && matchesCategory;
    });
  }, [products, searchQuery, activeGroup, activeCategory]);

  const activeCategories = useMemo(() => {
    if (activeGroup === 'all') return [];
    return categories.filter(c => c.group === activeGroup);
  }, [categories, activeGroup]);

  if (activeOrder) {
    return <OrderStatusView order={activeOrder} onClear={() => { localStorage.removeItem('last_order_id'); setActiveOrder(null); }} />;
  }

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-white min-h-screen relative font-sans border-x border-slate-100 shadow-sm pb-40">
      
      <header className="bg-slate-950 text-white pt-10 pb-20 px-6 md:px-12 rounded-b-[60px] relative shadow-2xl overflow-hidden">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-orange-600/20 rounded-full blur-[100px]" />
        <div className="flex justify-between items-center mb-10 relative z-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter italic text-orange-500">Menu SnackFlow</h1>
            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-500 mt-2">Escolha seu prato favorito</p>
          </div>
          <div className="w-12 h-12 flex items-center justify-center bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10">
            <Star size={20} className="text-orange-500" />
          </div>
        </div>
        
        <div className="relative z-10">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text"
            placeholder="Buscar hamburguer, bebida..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-full pl-16 pr-8 py-5 text-sm font-bold placeholder:text-slate-600 focus:bg-white focus:text-slate-900 outline-none transition-all duration-500"
          />
        </div>
      </header>

      <div className="px-6 -mt-10 z-20 relative space-y-6">
        <div className="flex space-x-3 overflow-x-auto pb-4 hide-scrollbar">
          <button 
            onClick={() => { setActiveGroup('all'); setActiveCategory('all'); }}
            className={`px-8 py-5 rounded-3xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all ${activeGroup === 'all' ? 'bg-orange-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}
          >
            🔥 Tudo
          </button>
          {groups.map(grp => (
            <button 
              key={grp.id}
              onClick={() => { setActiveGroup(grp.id); setActiveCategory('all'); }}
              className={`px-8 py-5 rounded-3xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all ${activeGroup === grp.id ? 'bg-orange-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}
            >
              {grp.icon && !grp.icon.startsWith('fa') && grp.icon + ' '}{grp.name}
            </button>
          ))}
        </div>

        {activeGroup !== 'all' && activeCategories.length > 0 && (
          <div className="flex space-x-2 overflow-x-auto pb-4 hide-scrollbar">
            {activeCategories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id === activeCategory ? 'all' : cat.id)}
                className={`px-5 py-3 rounded-2xl whitespace-nowrap text-[9px] font-black uppercase tracking-wider border transition-all ${activeCategory === cat.id ? 'bg-slate-950 border-slate-950 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 pb-40">
        {filteredProducts.map(product => (
          <motion.div 
            layout
            key={product.id}
            onClick={() => setSelectedProduct(product)}
            className="bg-white rounded-[40px] p-4 flex items-center gap-5 cursor-pointer border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group"
          >
            <div className="w-24 h-24 md:w-28 md:h-28 bg-slate-50 rounded-3xl overflow-hidden flex-shrink-0 shadow-inner">
              <img src={product.images?.[0] || 'https://via.placeholder.com/300'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-slate-950 text-base md:text-lg italic tracking-tight truncate leading-tight mb-1">{product.name}</h3>
              <p className="text-[10px] text-slate-400 font-medium line-clamp-2 leading-relaxed mb-3">{product.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-slate-950 font-black text-lg italic tracking-tighter">R$ {product.price.toFixed(2)}</span>
                <div className="bg-slate-50 p-2.5 rounded-xl text-indigo-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
                  <Plus size={16} strokeWidth={3} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-[60]">
             <button onClick={() => setIsCartOpen(true)} className="w-full bg-slate-950 text-white py-6 rounded-full font-black text-[10px] uppercase tracking-widest flex justify-between px-10 shadow-2xl items-center border border-white/10 group">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                    <ShoppingBag size={18} />
                  </div>
                  <span>Sacola</span>
               </div>
               <span className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">R$ {total.toFixed(2)}</span>
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={addToCart} />
        )}
      </AnimatePresence>

      <CartModal 
        isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} setCart={setCart}
        customerName={customerName} setCustomerName={setCustomerName} onOrderCreated={(id) => refreshData()}
      />
    </div>
  );
};

const ProductDetailModal: React.FC<{ product: Product, onClose: () => void, onAdd: (p: Product, q: number, n: string) => void }> = ({ product, onClose, onAdd }) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const { addToast } = useToast();

  const handleAdd = () => {
    onAdd(product, quantity, notes);
    addToast(`${product.name} adicionado!`, 'success');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl z-[150] flex items-end justify-center">
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full max-w-lg rounded-t-[60px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        <div className="relative h-72">
          <img src={product.images?.[0] || 'https://via.placeholder.com/600'} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          <button onClick={onClose} className="absolute top-8 left-8 bg-white/90 p-4 rounded-3xl text-slate-950 shadow-xl"><ChevronLeft size={24}/></button>
        </div>
        <div className="p-10 space-y-8">
          <div>
            <h2 className="text-3xl font-black text-slate-950 tracking-tighter italic mb-2 leading-none">{product.name}</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">{product.description}</p>
          </div>
          <div className="space-y-3">
             <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Observações</label>
             <textarea placeholder="Ex: Sem sal, ponto da carne..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-50 rounded-3xl p-6 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-orange-600 h-24 shadow-inner resize-none transition-all" />
          </div>
          <div className="flex items-center gap-5 pb-6">
            <div className="flex items-center bg-slate-100 rounded-[25px] p-1 shadow-inner">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-4 text-slate-400 hover:text-orange-600 transition-colors"><Minus size={20} strokeWidth={3} /></button>
              <span className="w-10 text-center font-black text-lg italic">{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)} className="p-4 text-slate-400 hover:text-orange-600 transition-colors"><Plus size={20} strokeWidth={3} /></button>
            </div>
            <button onClick={handleAdd} className="flex-1 bg-slate-950 text-white h-16 rounded-[25px] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-orange-600 transition-all flex justify-between items-center px-8">
              <span>Adicionar</span>
              <span className="opacity-40">R$ {(product.price * quantity).toFixed(2)}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const CartModal: React.FC<{ 
  isOpen: boolean, onClose: () => void, cart: OrderItem[], setCart: any, customerName: string, setCustomerName: any, onOrderCreated: any
}> = ({ isOpen, onClose, cart, setCart, customerName, setCustomerName, onOrderCreated }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cashAmount, setCashAmount] = useState<string>('');
  
  const { addToast } = useToast();
  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const changeAmount = useMemo(() => {
    if (paymentMethod !== 'cash' || !cashAmount) return 0;
    const received = parseFloat(cashAmount.replace(',', '.'));
    if (isNaN(received)) return 0;
    return Math.max(0, received - total);
  }, [paymentMethod, cashAmount, total]);

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      addToast("Por favor, informe seu nome para o pedido.", 'error');
      return;
    }
    
    let received = 0;
    if (paymentMethod === 'cash') {
       received = parseFloat(cashAmount.replace(',', '.'));
       if (isNaN(received) || received < total) {
         addToast("Valor entregue insuficiente para o total.", 'error');
         return;
       }
    } else {
       received = total; // Para cartao/pix assume-se pagamento exato
    }

    setLoading(true);
    try {
      const order = await api.orders.create({ 
        customer_name: customerName, 
        items: cart, 
        total, 
        status: 'pending', 
        payment_method: paymentMethod,
        received_amount: received,
        change_amount: paymentMethod === 'cash' ? (received - total) : 0,
        is_paid: false // Padrão é não pago até o caixa confirmar
      });
      
      localStorage.setItem('last_order_id', order.id);
      onOrderCreated(order.id);
      setCart([]);
      setCashAmount('');
      setPaymentMethod('card');
      onClose();
      addToast("Pedido enviado para a cozinha!", 'success');
    } catch (e) { 
      addToast("Erro ao processar o pedido. Tente novamente.", 'error');
    } finally { 
      setLoading(false); 
    }
  };

  const paymentOptions = [
    { id: 'card', label: 'Cartão', icon: CreditCard },
    { id: 'pix', label: 'Pix', icon: QrCode },
    { id: 'cash', label: 'Dinheiro', icon: Banknote },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/90 z-[200] flex items-end justify-center backdrop-blur-md">
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full max-w-lg rounded-t-[60px] p-8 md:p-10 flex flex-col max-h-[90vh] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-950 leading-none">Minha Sacola</h2>
              <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 scrollbar-hide min-h-0">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-5 rounded-[25px] border border-slate-100/50">
                  <div className="flex-1 pr-4">
                    <p className="font-black text-sm italic leading-tight text-slate-800">{item.quantity}x {item.name}</p>
                    {item.notes && <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">{item.notes}</p>}
                  </div>
                  <p className="font-black text-indigo-600 text-sm whitespace-nowrap">R$ {(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-5">
               <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Identificação</label>
                 <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Seu nome completo" className="w-full bg-slate-50 border-none rounded-[25px] p-5 font-bold outline-none focus:ring-2 focus:ring-orange-600 shadow-inner" />
               </div>

               <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Forma de Pagamento</label>
                 <div className="grid grid-cols-3 gap-3">
                    {paymentOptions.map((opt) => (
                      <button 
                        key={opt.id}
                        onClick={() => setPaymentMethod(opt.id as PaymentMethod)}
                        className={`flex flex-col items-center justify-center p-4 rounded-[20px] border-2 transition-all ${
                          paymentMethod === opt.id 
                            ? 'bg-slate-950 border-slate-950 text-white shadow-lg' 
                            : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        <opt.icon size={20} className="mb-2" />
                        <span className="text-[9px] font-black uppercase tracking-wider">{opt.label}</span>
                      </button>
                    ))}
                 </div>
               </div>

               <AnimatePresence>
                 {paymentMethod === 'cash' && (
                   <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                     <div className="bg-orange-50 p-5 rounded-[25px] border border-orange-100 space-y-4">
                       <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-orange-600/70 ml-1">Valor que vai entregar</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600 font-bold">R$</span>
                            <input 
                              type="number" 
                              value={cashAmount} 
                              onChange={e => setCashAmount(e.target.value)} 
                              placeholder="0,00" 
                              className="w-full bg-white border-none rounded-xl p-4 pl-10 font-black text-lg outline-none text-orange-600 placeholder:text-orange-200 shadow-sm" 
                            />
                          </div>
                       </div>
                       {changeAmount > 0 && (
                         <div className="flex justify-between items-center px-2">
                           <span className="text-[10px] font-bold uppercase text-orange-600/70">Seu Troco:</span>
                           <span className="text-xl font-black text-orange-600">R$ {changeAmount.toFixed(2)}</span>
                         </div>
                       )}
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>

               <div className="flex justify-between items-center p-2 border-t border-slate-50 pt-4">
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Total</span>
                 <span className="text-3xl font-black italic tracking-tighter text-slate-950 leading-none">R$ {total.toFixed(2)}</span>
               </div>
               
               <button onClick={handleCheckout} disabled={loading} className="w-full bg-slate-950 text-white py-6 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-orange-600 transition-all">
                 {loading ? 'Processando...' : 'Confirmar Pedido'}
               </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const OrderStatusView: React.FC<{ order: Order, onClear: () => void }> = ({ order, onClear }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white min-h-screen text-center max-w-lg mx-auto relative overflow-hidden">
    <div className="absolute top-0 right-0 w-96 h-96 bg-orange-50 rounded-full -mr-48 -mt-48 opacity-40 blur-3xl" />
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-28 h-28 bg-orange-600 rounded-[40px] flex items-center justify-center text-white mb-8 shadow-2xl shadow-orange-100 relative z-10">
      <Clock size={40} className="animate-pulse" />
    </motion.div>
    <div className="relative z-10 space-y-4">
      <h2 className="text-4xl font-black tracking-tighter italic text-slate-950 leading-tight uppercase">Pedido Recebido!</h2>
      <p className="text-slate-400 font-medium px-6">Seu prato já entrou na fila de produção. Fique de olho no status.</p>
    </div>
    <div className="my-10 p-8 bg-slate-50 rounded-[40px] border border-slate-100 flex items-center gap-6 relative z-10 w-full">
       <div className="text-left flex-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</p>
          <p className="text-xl font-black uppercase italic tracking-tighter text-orange-600 leading-none mt-2">{order.status === 'pending' ? 'Aguardando' : order.status === 'preparing' ? 'Preparando' : 'Pronto!'}</p>
       </div>
       <div className="text-left">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Senha</p>
          <p className="text-2xl font-black italic text-slate-950 leading-none mt-2">#{order.id.slice(-4)}</p>
       </div>
    </div>
    <button onClick={onClear} className="w-full bg-slate-950 text-white py-6 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-2xl relative z-10 hover:bg-orange-600 transition-all">Novo Pedido</button>
  </div>
);

export default CustomerView;