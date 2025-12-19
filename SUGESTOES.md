# Roadmap e Sugestões - WatBot

Este documento rastreia o progresso do projeto e futuras implementações.

## ✅ Funcionalidades Concluídas

### 1. Estrutura e Arquitetura
- [x] **Refatoração MVC:** Código modularizado em `controllers`, `services`, `routes`, `models`.
- [x] **Configuração Centralizada:** Arquivo `config.js` implementado.

### 2. Dados e Persistência
- [x] **Banco de Dados SQLite:** Migrado de JSON para SQLite com Sequelize.
- [x] **Isolamento de Dados:** Dados (templates, mídias) isolados por número de telefone conectado.
- [x] **Gestão de Mídia:** Limpeza automática de arquivos antigos e pasta dedicada.

### 3. Interface e Funcionalidades
- [x] **Templates de Mensagem:** Criação e persistência de modelos.
- [x] **Fila de Processamento:** Implementação básica de fila para envios.
- [x] **Manual Integrado:** Documentação dentro do app.
- [x] **Interface Limpa:** Remoção de painéis não utilizados (AdminDashboard/Galeria pública).

---

## 🚀 Próximos Passos (Sugestões)

### Prioridade Alta
1. **Autenticação Real:**
   - Implementar Login com JWT para proteger rotas críticas.
   - Criar sistema de usuários no banco de dados (além da simples conexão do WhatsApp).

2. **Chatbot / Auto-resposta (Keyword Reply):**
   - Criar tabela de `Regras` (Gatilho -> Resposta).
   - Permitir que o usuário configure respostas automáticas simples (ex: "Preço" -> Envia tabela).

### Prioridade Média
3. **Webhooks:**
   - Disparar requisição HTTP POST para uma URL externa quando chegar mensagem (integração CRM).

4. **Multi-sessão Real:**
   - Melhorar a interface para gerenciar múltiplas conexões simultâneas de forma mais visual.

5. **Relatórios Avançados:**
   - Exportar relatórios em Excel/PDF além de CSV.
   - Gráficos de desempenho (tempo médio de resposta, taxa de sucesso).

### Prioridade Baixa (Melhorias)
6. **Integração com IA (LLM):**
   - Conectar com Gemini/OpenAI para respostas generativas.
   - Analisar sentimento das mensagens recebidas.

7. **App Mobile PWA:**
   - Transformar a interface web em um Progressive Web App instalável no celular.

