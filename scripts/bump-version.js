import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const packageJsonPath = path.join(rootDir, 'package.json');
const publicVersionPath = path.join(rootDir, 'public', 'version.json');

const type = process.argv[2]; // 'patch', 'minor', 'major'

if (!['patch', 'minor', 'major'].includes(type)) {
  console.error('❌ Por favor, especifique o tipo de release: patch, minor ou major');
  console.log('   Exemplo: npm run release:patch');
  console.log('   ---------------------------------------------------------------');
  console.log('   patch = Correções de bugs, ajustes visuais (v1.0.0 -> v1.0.1)');
  console.log('   minor = Alterações no Banco de Dados/Tabelas (v1.0.0 -> v1.1.0)');
  console.log('   major = Novas funcionalidades ou integrações (v1.0.0 -> v2.0.0)');
  process.exit(1);
}

// Ler package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const currentVersion = packageJson.version;
let [major, minor, patch] = currentVersion.split('.').map(Number);

// Lógica de Incremento
if (type === 'major') {
  major++;
  minor = 0;
  patch = 0;
} else if (type === 'minor') {
  minor++;
  patch = 0;
} else if (type === 'patch') {
  patch++;
}

const newVersion = `${major}.${minor}.${patch}`;

// Atualizar package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

// Atualizar public/version.json
const versionData = {
  version: newVersion,
  buildTime: Date.now(),
  type: type
};
fs.writeFileSync(publicVersionPath, JSON.stringify(versionData, null, 2));

console.log(`\n✅ Versão atualizada com sucesso!`);
console.log(`   De: \x1b[31m${currentVersion}\x1b[0m`);
console.log(`   Para: \x1b[32m${newVersion}\x1b[0m`);
console.log(`   Tipo: ${type.toUpperCase()}`);
console.log(`\n🚀 Não se esqueça de rodar o build: npm run build\n`);