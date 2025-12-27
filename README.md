
# 🍔 SnackFlow - Sistema de Lanchonete Inteligente

O **SnackFlow** é uma solução completa para gestão de lanchonetes, unindo um cardápio digital para clientes e um sistema de gerenciamento de cozinha (KDS).

## 🚀 Tecnologias
- **Frontend:** React + Tailwind CSS
- **Backend:** [PocketBase](https://pocketbase.io/)
- **Infra:** Docker & Docker Compose

## 🛠️ Como rodar o projeto (Sincronizado)

Para subir o ambiente completo (Frontend + Banco de Dados) com as credenciais configuradas:

1.  **Certifique-se de ter o Docker instalado.**
2.  **Suba os containers:**
    ```bash
    docker-compose up -d --build
    ```
3.  **Acesse o sistema:**
    -   **Frontend:** `http://localhost`
    -   **Admin PocketBase:** `http://localhost:8090/_/`

## 🔑 Credenciais de Administrador (Padrão)
Se você não configurou o arquivo `.env`, o sistema usará:
- **Usuário:** `salvador@localhost.com`
- **Senha:** `12345678`

## 📦 Estrutura
- `pb_data/`: Dados persistentes do banco de dados.
- `pb_public/`: Arquivos estáticos servidos pelo PocketBase (se necessário).
- `dist/`: Build final do frontend.