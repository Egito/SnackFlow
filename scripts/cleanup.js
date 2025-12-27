import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Lista de arquivos na RAIZ que devem ser removidos (pois foram movidos para src/)
const filesToDelete = [
  'index.tsx',
  'App.tsx',
  'types.ts',
  'index.css',
  'Dockerfile.watcher',
  'docker-compose.yml',
  'watcher.sh'
];

// Lista de pastas na RAIZ que devem ser removidas (pois foram movidas para src/)
// CUIDADO: Não inclua 'src', 'docker', 'scripts', 'public' ou 'dist' aqui.
const directoriesToDelete = [
  'components',
  'pages',
  'services',
  'context'
];

console.log('🧹 Iniciando limpeza do projeto...');

// 1. Remover Arquivos Soltos
filesToDelete.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Removido: ${file}`);
    } catch (e) {
      console.error(`❌ Erro ao remover ${file}:`, e.message);
    }
  }
});

// 2. Remover Diretórios Antigos
directoriesToDelete.forEach(dir => {
  const dirPath = path.join(rootDir, dir);
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Pasta Removida: ${dir}/`);
    } catch (e) {
      console.error(`❌ Erro ao remover pasta ${dir}:`, e.message);
    }
  }
});

console.log('\n✨ Limpeza concluída! A estrutura agora está organizada em src/ e docker/.');
