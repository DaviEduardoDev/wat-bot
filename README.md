# Disparador Humanizado de WhatsApp (WatBot)

Este projeto é uma ferramenta profissional de automação para envio de mensagens em massa via WhatsApp, desenvolvida com Node.js e `wppconnect`. Ele simula o comportamento humano para garantir máxima segurança contra bloqueios.

## 🚀 Novidades da Versão 2.1 - Admin Dashboard & Mobile

- **Painel Administrativo (`/admin`):** Novo dashboard seguro protegido por senha e JWT.
- **Log de Acessos:** Sistema de auditoria que registra logins, IPs e ações críticas.
- **Visualização de Mídia:** Agora é possível ver as imagens, vídeos e ouvir áudios enviados diretamente nos logs.
- **Mobile First:** Interface totalmente responsiva e adaptada para celulares.
- **Controle de Sessões:** Desconecte ou pare disparos de qualquer sessão remotamente.

## 🌟 Funcionalidades Principais

- **Busca Nativa de Contatos:** Carrega seus contatos diretamente da agenda do WhatsApp.
- **Envio de Mídia:** Suporte total a imagens, vídeos e áudios (gravados como se fosse na hora).
- **Modelos de Mensagem:** Crie e salve templates de mensagens.
- **Manual Integrado:** Guia de uso completo dentro da interface.
- **Agendamento Inteligente:** Programe disparos com delay humanizado.
- **Proteção Antibloqueio:** Intervalos aleatórios entre 15 a 40 segundos.

## 🛠️ Tecnologias

- **Backend:** Node.js, Express, Socket.io
- **Segurança:** JWT (JSON Web Tokens), BCrypt
- **Database:** SQLite (Sequelize ORM)
- **Engine:** @wppconnect-team/wppconnect
- **Frontend:** Bootstrap 5, Chart.js

## 📋 Pré-requisitos

- Node.js (v18+)
- Google Chrome instalado

## ⚙️ Instalação e Configuração

1. **Clone o projeto:**
   ```bash
   git clone https://github.com/DaviEduardoDev/wat-bot.git
   cd wat-bot
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configuração (.env):**
   Crie um arquivo `.env` na raiz:
   ```env
   # Admin
   ADMIN_PASSWORD=admin123
   JWT_SECRET=sua_chave_secreta_super_segura_aqui
   
   # Server
   PORT=3000
   ```

## ▶️ Como Usar

### 1. Iniciar o Servidor
```bash
npm start
```

### 2. Acessar o Bot
- **Painel do Usuário:** [http://localhost:3000](http://localhost:3000)
- **Painel Admin:** [http://localhost:3000/admin](http://localhost:3000/admin) (Senha padrão: `admin123`)

### 3. Conectar WhatsApp
1. No painel, digite seu número (com DDD).
2. Clique em **"Gerar Código"**.
3. No celular: **WhatsApp > Configurações > Aparelhos Conectados > Conectar com número**.
4. Digite o código exibido.

## 🔐 Segurança do Admin

- O painel admin é protegido por **Token JWT**.
- O token expira automaticamente após 24 horas.
- Tentativas de login falhas são registradas no banco de dados.
- O sistema de logs monitora quem desconectou sessões ou parou campanhas.

## 📂 Estrutura

```
/src
  /config       # .env e Database
  /controllers  # Admin e Lógica de Negócios
  /middleware   # Autenticação JWT
  /models       # Banco de Dados (AdminLog, Template)
  /routes       # Rotas Protegidas
  /services     # WPPConnect e Filas
  /socket       # Realtime
/public         # Telas (Login, Admin, Index)
```

## ⚠️ Aviso Legal

Esta ferramenta foi criada para fins de automação legítima. O uso para SPAM ou envio não solicitado pode levar ao banimento do número pelo WhatsApp. Use com responsabilidade.