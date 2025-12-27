import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import pb, { logout as pbLogout } from '../services/pocketbase';
import { api, bootstrapSystem } from '../services/api';
import { Group, Category, Product, Order } from '../types';

const APP_VERSION = import.meta.env.PACKAGE_VERSION || '1.0.0';

interface AppContextType {
  user: any;
  isAdmin: boolean;
  isInitializing: boolean;
  setupRequired: boolean;
  groups: Group[];
  categories: Category[];
  products: Product[];
  orders: Order[];
  refreshData: () => void;
  logout: () => void;
  isAutoLogoutEnabled: boolean;
  setAutoLogoutEnabled: (enabled: boolean) => void;
  appVersion: string;
  updateAvailable: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState(pb.authStore.model);
  const [isInitializing, setIsInitializing] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAutoLogoutEnabled, setAutoLogoutEnabled] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Verifica versão
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch('/version.json');
        if (!res.ok) return;
        const data = await res.json();
        if (data.version !== APP_VERSION) {
          setUpdateAvailable(true);
        }
      } catch (e) { /* ignore */ }
    };
    checkVersion();
    const interval = setInterval(checkVersion, 60 * 60 * 1000); 
    return () => clearInterval(interval);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [g, c, p] = await Promise.all([
        api.menu.getGroups(),
        api.menu.getCategories(),
        api.menu.getProducts(),
      ]);
      setGroups(g);
      setCategories(c);
      setProducts(p);

      const activeOrders = await api.orders.getActiveOrders();
      setOrders(activeOrders);
    } catch (e) {
      console.error("Erro ao atualizar dados:", e);
    }
  }, []);

  // Listener de Auth
  useEffect(() => {
    return pb.authStore.onChange((token, model) => {
      setUser(model);
      refreshData();
    });
  }, [refreshData]);

  // Inicialização e Bootstrap
  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      try {
        // Verifica se precisa de setup inicial
        const status = await bootstrapSystem();
        if (status.status === 'manual_setup') {
          setSetupRequired(true);
        } else {
          await refreshData();
        }
      } catch (e) {
        console.error("Falha na inicialização", e);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, [refreshData]);

  // Real-time subscriptions
  useEffect(() => {
    // Subscreve a mudanças nos pedidos para atualizar o KDS em tempo real
    api.orders.subscribe(() => {
        api.orders.getActiveOrders().then(setOrders);
    });

    return () => {
        api.orders.unsubscribe();
    };
  }, []);

  const logout = () => {
    pbLogout();
  };

  return (
    <AppContext.Provider value={{
      user,
      isAdmin: !!user && pb.authStore.isSuperuser,
      isInitializing,
      setupRequired,
      groups,
      categories,
      products,
      orders,
      refreshData,
      logout,
      isAutoLogoutEnabled,
      setAutoLogoutEnabled,
      appVersion: APP_VERSION,
      updateAvailable
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp deve ser usado dentro de um AppProvider");
  return context;
};