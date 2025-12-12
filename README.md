# Disparador Humanizado de WhatsApp (WatBot)

Este projeto é uma ferramenta de automação para envio de mensagens em massa via WhatsApp, utilizando a biblioteca `wppconnect`. Ele foi projetado para simular comportamento humano e evitar bloqueios.

## Funcionalidades Principais

- **Busca Nativa de Contatos:** Carrega seus contatos diretamente do WhatsApp, filtrando grupos e contatos bloqueados.
- **Envio de Mídia:** Suporte para imagens, vídeos, áudios (como gravado na hora) e PDF.
- **Agendamento:** Programe disparos para uma data e hora específicas.
- **Delay Humanizado:** Aguarda entre **15 a 40 segundos** (aleatório) entre cada envio para segurança da conta.
- **Relatórios:** Gera arquivos CSV com o status de cada envio (Sucesso/Erro).

## Pré-requisitos

- Node.js instalado (versão 14 ou superior).
- Google Chrome instalado.

## Instalação

1. Abra o terminal na pasta do projeto.
2. Instale as dependências:

```bash
npm install
```

## Configuração

1. Crie um arquivo chamado `.env` na raiz do projeto.
2. Adicione a seguinte linha para definir a senha de administrador:

```env
ADMIN_PASSWORD=sua_senha_aqui
```

> **Nota:** Se não configurado, a senha padrão será `admin123`.

## Como Usar

1. **Iniciar o Bot:**
   Execute o arquivo `start.bat` ou rode no terminal:
   ```bash
   node bot.js
   ```

2. **Acessar o Painel:**
   Abra o navegador em `http://localhost:3000`.

3. **Conectar:**
   - Digite seu número de WhatsApp (com DDD).
   - Clique em "Gerar Código".
   - Insira o código exibido no seu WhatsApp (Aparelhos Conectados > Conectar Aparelho > Conectar com número de telefone).

4. **Carregar Contatos:**
   - Clique no botão **"📂 Carregar Contatos do WhatsApp"**.
   - Aguarde o carregamento.
   - Use a barra de busca para filtrar ou selecione manualmente os contatos desejados.

5. **Configurar Mensagem:**
   - Digite sua mensagem. Use formatação do WhatsApp (*negrito*, _itálico_, etc).
   - (Opcional) Anexe uma mídia.
   - (Opcional) Agende o horário.

6. **Disparar:**
   - Clique em **"INICIAR 🚀"**.
   - Acompanhe o progresso na barra e no log lateral.

## Limites e Recomendações

- **Sessões Simultâneas:** Recomendado entre **5 a 10 sessões** simultâneas em uma máquina comum (8GB RAM), devido ao consumo de recursos do Chrome.
- **Anti-Bloqueio:** O bot já possui delays de segurança, mas evite enviar milhares de mensagens para contatos que não salvaram seu número (SPAM), pois isso aumenta o risco de denúncias e bloqueio.

## Solução de Problemas

### O executável fecha sozinho?
Isso geralmente acontece se o bot não encontrar o Google Chrome instalado. Certifique-se de que ele está instalado.

### Contatos não aparecem?
Certifique-se de que o WhatsApp terminou de sincronizar os contatos no celular antes de clicar em carregar.