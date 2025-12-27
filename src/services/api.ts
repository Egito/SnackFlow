import PocketBase from 'pocketbase';
import pb, { getPBUrl } from './pocketbase';
import { Category, Product, Order, OrderStatus, Group } from '../types';

// Credenciais de instalação (Bootstrap) e Superusuário Padrão
export const DEFAULT_ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'salvador@localhost.com';
export const DEFAULT_ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || '12345678';

// Helper para limpar campos de sistema do PocketBase antes de salvar
const cleanData = (data: any) => {
  const { id, created, updated, collectionId, collectionName, expand, ...clean } = data;
  return clean;
};

export const api = {
  menu: {
    getGroups: () => pb.collection('groups').getFullList<Group>({ sort: 'name' }),
    getCategories: () => pb.collection('categories').getFullList<Category>({ sort: 'order' }),
    getProducts: () => pb.collection('products').getFullList<Product>({ filter: 'active = true', sort: 'name' }),
    getAllProducts: () => pb.collection('products').getFullList<Product>({ sort: 'name' }),
  },
  
  orders: {
    getOne: (id: string) => pb.collection('orders').getOne<Order>(id),
    getActiveOrders: () => pb.collection('orders').getFullList<Order>({
      sort: '-created',
      filter: 'status != "delivered" && status != "cancelled"'
    }),
    getHistory: (startDate?: Date, endDate?: Date) => {
      let filter = 'status = "delivered"';
      if (startDate && endDate) {
        const start = startDate.toISOString().replace('T', ' ').split('.')[0];
        const end = endDate.toISOString().replace('T', ' ').split('.')[0];
        filter += ` && created >= "${start}" && created <= "${end}"`;
      }
      return pb.collection('orders').getFullList<Order>({ filter, sort: '-created' });
    },
    create: (data: any) => pb.collection('orders').create(data),
    updateStatus: (id: string, status: OrderStatus) => pb.collection('orders').update(id, { status }),
    markAsPaid: (id: string) => pb.collection('orders').update(id, { is_paid: true }),
    subscribe: (callback: () => void) => pb.collection('orders').subscribe('*', callback),
    unsubscribe: () => pb.collection('orders').unsubscribe(),
  },

  admin: {
    saveGroup: (group: Partial<Group>) => {
      const data = cleanData(group);
      if (group.id) return pb.collection('groups').update(group.id, data);
      return pb.collection('groups').create(data);
    },
    deleteGroup: (id: string) => pb.collection('groups').delete(id),

    saveCategory: (category: Partial<Category>) => {
      const data = cleanData(category);
      if (category.id) return pb.collection('categories').update(category.id, data);
      return pb.collection('categories').create(data);
    },
    deleteCategory: (id: string) => pb.collection('categories').delete(id),

    saveProduct: (product: Partial<Product>) => {
      const cleanProduct = cleanData(product);
      const data = { ...cleanProduct, active: true };
      if (product.id) return pb.collection('products').update(product.id, data);
      return pb.collection('products').create(data);
    },
    deleteProduct: (id: string) => pb.collection('products').delete(id),
  }
};

// --- SYSTEM BOOTSTRAPPER ---

const INITIAL_DATA = [
  {
    group: { name: 'Lanches', icon: 'fas fa-burger' },
    categories: [
      {
        name: 'Artesanais', icon: 'burger', order: 1,
        products: [
          { name: 'X-Snack Bacon', description: 'Pão brioche, blend 180g, muito bacon crocante, cheddar inglês e maionese da casa.', price: 32.90, images: ['https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600'] },
          { name: 'Smash Duplo', description: 'Dois blends de 80g prensados na chapa, queijo prato, cebola caramelizada e picles.', price: 28.50, images: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600'] },
          { name: 'Chicken Crispy', description: 'Filé de frango empanado, alface americana, tomate e molho honey mustard.', price: 25.00, images: ['https://images.unsplash.com/photo-1615557960916-5f4791effe9d?w=600'] }
        ]
      },
      {
        name: 'Hot Dogs', icon: 'hotdog', order: 2,
        products: [
          { name: 'Dogão Clássico', description: 'Pão, salsicha, purê, batata palha, milho e vinagrete.', price: 18.00, images: ['https://images.unsplash.com/photo-1612392062631-94dd858cba88?w=600'] },
          { name: 'Dogão Cheddar', description: 'Pão, duas salsichas, muito cheddar cremoso e bacon em cubos.', price: 22.00, images: ['https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600'] }
        ]
      }
    ]
  },
  {
    group: { name: 'Bebidas', icon: 'fas fa-glass-water' },
    categories: [
      {
        name: 'Refrigerantes', icon: 'soda', order: 1,
        products: [
          { name: 'Coca-Cola Lata', description: 'Lata 350ml gelada.', price: 6.00, images: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600'] },
          { name: 'Guaraná Antarctica', description: 'Lata 350ml.', price: 6.00, images: ['https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=600'] }
        ]
      },
      {
        name: 'Sucos Naturais', icon: 'leaf', order: 2,
        products: [
          { name: 'Suco de Laranja', description: '500ml, espremido na hora.', price: 10.00, images: ['https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600'] },
          { name: 'Limonada Suíça', description: '500ml, com leite condensado.', price: 12.00, images: ['https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600'] }
        ]
      }
    ]
  },
  {
    group: { name: 'Sobremesas', icon: 'fas fa-ice-cream' },
    categories: [
      {
        name: 'Gelados', icon: 'ice-cream', order: 1,
        products: [
          { name: 'Milkshake Ovomaltine', description: '500ml de pura cremosidade e flocos crocantes.', price: 18.90, images: ['https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600'] },
          { name: 'Sundae Morango', description: 'Sorvete de baunilha com calda de morango e castanhas.', price: 14.00, images: ['https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600'] }
        ]
      }
    ]
  }
];

export interface BootstrapResult {
  status: 'success' | 'manual_setup' | 'error' | 'already_setup';
  message?: string;
}

// Função principal de instalação automática
export const bootstrapSystem = async (): Promise<BootstrapResult> => {
  // Cria uma instância isolada para bootstrap para NÃO disparar eventos de auth globais na UI
  const bootPb = new PocketBase(getPBUrl());
  bootPb.autoCancellation(false);

  try {
    // 1. Verificação de Saúde (pública)
    try {
        const count = await pb.collection('groups').getList(1, 1);
        if (count.totalItems > 0) return { status: 'already_setup' };
    } catch (e: any) {
        if (e.status !== 404 && e.status !== 400) throw e;
        // 404 ou 400 indica que provavelmente não existe tabela ou schema
    }
    
    // Tenta autenticar a instância isolada de bootstrap
    try {
        await bootPb.admins.authWithPassword(DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASS);
    } catch (e) {
        // Se não conseguir logar no bootPb e o usuário principal (pb) também não for admin
        if (!pb.authStore.isSuperuser) {
             // Admin não existe ou senha errada.
             // Como deu erro na leitura pública (passo 1), assumimos que precisa de setup manual se não conseguimos logar.
             return { status: 'manual_setup', message: "Admin user not found." };
        }
    }

    // Decide qual cliente usar: o isolado (bootPb) ou o principal (pb) se o usuário já estiver logado nele
    const client = bootPb.authStore.isSuperuser ? bootPb : (pb.authStore.isSuperuser ? pb : null);

    if (!client) {
         return { status: 'manual_setup' };
    }

    try {
        // Verifica novamente com privilégios
        try {
            await client.collection('groups').getList(1,1);
            // Se existe, popula
            await populateData(client);
        } catch (e: any) {
            // Se não existe, cria tudo
            await createSchema(client);
            await createInitialUser(client);
            await populateData(client);
        }
        
        return { status: 'success', message: "Sistema configurado com sucesso." };
    } catch (err: any) {
        console.error("❌ Erro durante o bootstrap:", err);
        return { status: 'error', message: err.message };
    }

  } catch (e: any) {
    console.error("Erro inesperado no bootstrap:", e);
    return { status: 'error', message: e.message };
  }
};

// Funções agora aceitam o cliente PB como argumento
const createSchema = async (client: PocketBase) => {
  console.log("🏗️ Criando tabelas (Schema)...");
  
  const safeCreate = async (collection: any) => {
      try {
          await client.collections.create(collection);
      } catch (e: any) {
          // Ignora se já existe
          if (e.status !== 400) console.log(`Info: ${collection.name} check skipped.`);
      }
  };

  await safeCreate({
    name: 'groups',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', required: true },
      { name: 'icon', type: 'text' }
    ],
    listRule: '', viewRule: '',
  });

  await safeCreate({
    name: 'categories',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', required: true },
      { name: 'icon', type: 'text' },
      { name: 'order', type: 'number' },
      { name: 'group', type: 'relation', required: true, options: { collectionId: 'groups', cascadeDelete: true } }
    ],
    listRule: '', viewRule: '',
  });

  await safeCreate({
    name: 'products',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'text' },
      { name: 'price', type: 'number', required: true },
      { name: 'images', type: 'json' }, 
      { name: 'active', type: 'bool' },
      { name: 'group', type: 'relation', required: true, options: { collectionId: 'groups', cascadeDelete: false } },
      { name: 'category', type: 'relation', required: true, options: { collectionId: 'categories', cascadeDelete: false } }
    ],
    listRule: '', viewRule: '',
  });

  await safeCreate({
    name: 'orders',
    type: 'base',
    schema: [
      { name: 'customer_name', type: 'text', required: true },
      { name: 'status', type: 'select', options: { values: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'] } },
      { name: 'total', type: 'number' },
      { name: 'items', type: 'json' },
      { name: 'payment_method', type: 'text' },
      { name: 'received_amount', type: 'number' },
      { name: 'change_amount', type: 'number' },
      { name: 'is_paid', type: 'bool' }
    ],
    listRule: '', viewRule: '', createRule: '', updateRule: '', 
  });
};

const createInitialUser = async (client: PocketBase) => {
  console.log("👤 Criando usuário proprietário padrão...");
  try {
    // Tenta encontrar pelo email
    const existing = await client.collection('users').getList(1, 1, { filter: `email = "${DEFAULT_ADMIN_EMAIL}"` });
    if (existing.totalItems === 0) {
      await client.collection('users').create({
        email: DEFAULT_ADMIN_EMAIL,
        password: DEFAULT_ADMIN_PASS,
        passwordConfirm: DEFAULT_ADMIN_PASS,
        name: 'Proprietário'
      });
      console.log("✅ Usuário proprietário criado.");
    }
  } catch (e) {
    // Silencia erros, pois o usuário pode já existir ou ser o próprio admin
  }
};

const populateData = async (client: PocketBase) => {
  console.log("🌱 Inserindo dados do cardápio...");
  const check = await client.collection('groups').getList(1, 1);
  if (check.totalItems > 0) return;

  for (const groupData of INITIAL_DATA) {
    try {
        const group = await client.collection('groups').create(groupData.group);
        
        for (const catData of groupData.categories) {
          const category = await client.collection('categories').create({
            name: catData.name,
            icon: catData.icon,
            order: catData.order,
            group: group.id
          });

          for (const prodData of catData.products) {
            await client.collection('products').create({
              ...prodData,
              active: true,
              group: group.id,
              category: category.id
            });
          }
        }
    } catch(e) {
        console.log("Erro ao popular:", e);
    }
  }
};