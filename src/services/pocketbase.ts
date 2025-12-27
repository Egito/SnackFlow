import PocketBase from 'pocketbase';

/**
 * Resolve a URL do PocketBase de forma dinâmica:
 * 1. Tenta a variável de ambiente (VITE_PB_URL) de forma segura
 * 2. Tenta o hostname atual na porta 8090 (padrão do docker-compose)
 * 3. Fallback para localhost
 */
const getPBUrl = () => {
  let envUrl = null;
  try {
    // Verifica se process e process.env existem antes de acessar
    if (typeof process !== 'undefined' && process.env) {
      envUrl = (process.env as any).VITE_PB_URL;
    }
  } catch (e) {
    // Silencia erros de referência
  }

  if (envUrl) return envUrl;

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    // Se estivermos acessando o frontend, o backend costuma estar no mesmo host, porta 8090
    return `${protocol}//${hostname}:8090`;
  }
  
  return 'http://127.0.0.1:8090';
};

const pb = new PocketBase(getPBUrl());

export const login = async (email: string, pass: string) => {
  return await pb.collection('users').authWithPassword(email, pass);
};

export const logout = () => {
  pb.authStore.clear();
};

export default pb;