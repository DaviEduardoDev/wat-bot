const express = require('express');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const wppconnect = require('@wppconnect-team/wppconnect');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json()); // Enable JSON body parsing for admin actions

const HISTORY_FILE = './history.json';
let sessions = new Map();
let initializingSessions = new Set();

// Função de Persistência
// Função de Persistência
function saveLog(telefone, mensagem, status, mediaFilename = null) {
  try {
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf8');
      history = JSON.parse(data);
    }

    history.push({
      data: new Date(),
      telefone,
      mensagem, // Agora contém o texto completo
      status,
      mediaFilename // Novo campo
    });

    // Manter apenas os últimos 1000 registros
    if (history.length > 1000) {
      history = history.slice(-1000);
    }

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Erro ao salvar log:', error);
  }
}



// Configuração do Multer para Mídia
const storageMedia = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './')
  },
  filename: function (req, file, cb) {
    const telefone = req.query.telefone || 'unknown';
    const ext = path.extname(file.originalname);
    cb(null, `midia_${telefone}${ext}`);
  }
});
const uploadMedia = multer({
  storage: storageMedia,
  limits: { fileSize: 50 * 1024 * 1024 } // Limite de 50MB
});

// Servir arquivos estáticos (Frontend)
app.use(express.static('public'));



// Rota de Upload de Mídia
app.post('/upload-media', (req, res) => {
  uploadMedia.single('file')(req, res, (err) => {
    if (err) {
      console.error('Erro no Multer:', err);
      return res.status(500).json({ success: false, message: 'Erro ao salvar arquivo: ' + err.message });
    }

    const telefone = req.query.telefone;
    if (!telefone) return res.status(400).json({ success: false, message: 'Telefone não informado.' });

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
    }

    console.log(`Mídia recebida de ${telefone}!`);
    const ext = path.extname(req.file.originalname);
    res.json({ success: true, message: 'Mídia carregada com sucesso!', type: ext });
    io.to(telefone).emit('log', { message: `Mídia (${ext}) carregada com sucesso!` });
  });
});

// Rota de Dashboard
app.get('/stats', (req, res) => {
  const telefone = req.query.telefone;
  if (!telefone) return res.status(400).json({ success: false, message: 'Telefone não informado.' });

  try {
    const publicDir = path.join(__dirname, 'public');
    // Filtra relatórios apenas deste telefone
    const files = fs.readdirSync(publicDir).filter(f => f.startsWith(`relatorio_${telefone}_`) && f.endsWith('.csv'));

    let totalCampaigns = files.length;
    let totalSent = 0;
    let totalSuccess = 0;
    let totalError = 0;
    let history = [];

    files.forEach(file => {
      const content = fs.readFileSync(path.join(publicDir, file), 'utf-8');
      const lines = content.split('\n').slice(1).filter(l => l.trim());
      const campaignTotal = lines.length;
      const campaignSuccess = lines.filter(l => l.includes(',Sucesso,')).length;
      const campaignError = campaignTotal - campaignSuccess;

      totalSent += campaignTotal;
      totalSuccess += campaignSuccess;
      totalError += campaignError;

      // Extrai timestamp do nome do arquivo: relatorio_TELEFONE_TIMESTAMP.csv
      const parts = file.replace('.csv', '').split('_');
      const timestamp = parseInt(parts[parts.length - 1]);
      const date = new Date(timestamp).toLocaleString();

      history.push({
        date,
        total: campaignTotal,
        success: campaignSuccess,
        error: campaignError,
        file
      });
    });

    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      stats: {
        totalCampaigns,
        totalSent,
        totalSuccess,
        totalError,
        history
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao gerar estatísticas.' });
  }
});

// Rota Admin Protegida (Serve Mídia)
app.get('/admin/media/:filename', (req, res) => {
  const senha = req.query.senha;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (senha !== adminPassword) {
    return res.status(403).send('Acesso Negado');
  }

  const filename = req.params.filename;
  // Segurança básica: evitar Path Traversal e permitir apenas midia_
  if (!filename.startsWith('midia_') || filename.includes('..') || filename.includes('/')) {
    return res.status(400).send('Arquivo inválido');
  }

  const filePath = path.join(__dirname, filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Arquivo não encontrado (pode ter sido excluído após o envio)');
  }
});

// Helper para obter bateria (seguro)
async function getBatteryLevel(client) {
  try {
    const info = await client.getHostDevice();
    return info && info.battery ? info.battery : 0;
  } catch (e) {
    return 0; // Fallback se falhar
  }
}

// Rota Admin Protegida (Serve HTML)
app.get('/admin', (req, res) => {
  const senha = req.query.senha;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (senha !== adminPassword) {
    return res.status(403).send('<h1>Acesso Negado</h1><p>Senha incorreta.</p>');
  }

  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API para Dados do Admin
app.get('/admin/stats', async (req, res) => {
  const senha = req.query.senha;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (senha !== adminPassword) return res.status(403).json({ success: false });

  let history = [];
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
  } catch (e) { console.error(e); }

  // Stats Counters
  const hoje = new Date();
  const todaySends = history.filter(h => {
    const d = new Date(h.data);
    return d.getDate() === hoje.getDate() &&
      d.getMonth() === hoje.getMonth() &&
      d.getFullYear() === hoje.getFullYear();
  }).length;

  // Active Sessions Data
  const sessionData = [];
  for (const [phone, session] of sessions.entries()) {
    const battery = await getBatteryLevel(session.client);
    sessionData.push({
      phone,
      battery,
      status: 'connected' // Simplificado, já que está na lista de sessões ativas
    });
  }

  // Chart Data (Last 24h)
  const hours = {};
  const currentHour = hoje.getHours();
  for (let i = 0; i < 24; i++) {
    // Create keys like "14h", "13h"... working backwards
    let h = currentHour - i;
    if (h < 0) h += 24;
    hours[h + 'h'] = 0;
  }

  // Populate chart
  history.forEach(h => {
    const d = new Date(h.data);
    // Filter for last 24h roughly
    if (hoje.getTime() - d.getTime() < 24 * 60 * 60 * 1000) {
      const key = d.getHours() + 'h';
      if (hours[key] !== undefined) hours[key]++;
    }
  });

  res.json({
    success: true,
    stats: {
      todaySends,
      totalLogs: history.length
    },
    sessions: sessionData,
    logs: history.slice().reverse().slice(0, 50), // Last 50 logs
    chartData: {
      labels: Object.keys(hours).reverse(), // Oldest to newest
      values: Object.values(hours).reverse()
    }
  });
});

// API para Ações do Admin
app.post('/admin/action', async (req, res) => {
  const { action, phone, senha } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (senha !== adminPassword) return res.status(403).json({ success: false, message: 'Senha inválida' });

  const session = sessions.get(phone);
  if (!session) return res.status(404).json({ success: false, message: 'Sessão não encontrada' });

  if (action === 'disconnect') {
    try {
      await session.client.logout();
      await session.client.close();
    } catch (e) {
      console.error('Erro no logout forçado:', e);
    }
    sessions.delete(phone);
    io.to(phone).emit('status', 'disconnected');
    return res.json({ success: true, message: `Sessão ${phone} desconectada.` });
  }

  if (action === 'stop') {
    session.shouldStop = true;
    session.isPaused = false; // Unpause to let loop break
    io.to(phone).emit('log', { message: '🛑 Parada forçada pelo Admin.' });
    return res.json({ success: true, message: `Disparos para ${phone} interrompidos.` });
  }

  return res.status(400).json({ success: false, message: 'Ação desconhecida' });
});



// Socket.io
io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);

  socket.on('iniciar-sessao', async ({ telefone }) => {
    if (!telefone) return;

    // Join room for this phone number
    socket.join(telefone);

    if (sessions.has(telefone)) {
      io.to(telefone).emit('log', { message: 'Sessão já ativa para este número.' });
      io.to(telefone).emit('status', 'connected');
      return;
    }

    if (initializingSessions.has(telefone)) {
      io.to(telefone).emit('log', { message: 'Sessão já está sendo inicializada. Aguarde...' });
      return;
    }

    initializingSessions.add(telefone);

    io.to(telefone).emit('log', { message: 'Iniciando WPPConnect...' });

    try {
      const client = await wppconnect.create({
        session: `session-${telefone}`,
        phoneNumber: telefone,
        usePairingCode: true,
        whatsappVersion: '2.2412.54',
        headless: true,
        useChrome: true,
        logQR: false,
        autoClose: 0,
        disableWelcome: true,
        puppeteerOptions: {
          userDataDir: `./tokens/session-${telefone}`, // Force unique user data dir
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        },
        catchQR: (base64Qr, asciiQR, attempts, urlCode) => {
          console.log('QR Code recebido (fallback).');
        },
        catchLinkCode: (code) => {
          console.log(`Código para ${telefone}:`, code);
          io.to(telefone).emit('pairing-code', code);
          io.to(telefone).emit('log', { message: `Código de Pareamento: ${code}` });
        },
        statusFind: (statusSession, session) => {

          io.to(telefone).emit('log', { message: `Status: ${statusSession}` });
          if (statusSession === 'inChat' || statusSession === 'isLogged' || statusSession === 'successChat') {
            io.to(telefone).emit('status', 'connected');
          }
        }
      });

      // Polling para garantir que a conexão seja detectada
      const checkConnectionInterval = setInterval(async () => {
        try {
          if (sessions.has(telefone)) {
            const isConnected = await client.isConnected();
            if (isConnected) {
              io.to(telefone).emit('status', 'connected');
              io.to(telefone).emit('log', { message: 'Conexão detectada via verificação periódica.' });
              clearInterval(checkConnectionInterval);
            }
          } else {
            clearInterval(checkConnectionInterval);
          }
        } catch (error) {
          // Ignora erros de verificação se o cliente não estiver pronto
        }
      }, 3000);

      // Store session
      sessions.set(telefone, {
        client,
        isPaused: false,
        shouldStop: false
      });

      io.to(telefone).emit('log', { message: 'Aguarde o código...' });

      client.onStateChange((state) => {

        io.to(telefone).emit('log', { message: `Estado: ${state}` });
        if (state === 'CONNECTED') {
          io.to(telefone).emit('status', 'connected');
        }
      });

    } catch (error) {
      console.error(`Erro ao criar sessão ${telefone}:`, error);
      if (JSON.stringify(error).includes('IQErrorRateOverlimit')) {
        io.to(telefone).emit('error-rate-limit', 'O WhatsApp bloqueou temporariamente a criação de códigos para este número (Muitas tentativas). Aguarde algumas horas.');
      }
      io.to(telefone).emit('log', { message: 'Erro ao iniciar sessão: ' + error.message });
    } finally {
      initializingSessions.delete(telefone);
    }
  });

  socket.on('pausar-disparos', ({ telefone }) => {
    const session = sessions.get(telefone);
    if (session) {
      session.isPaused = true;
      io.to(telefone).emit('log', { message: '⏸️ Disparos PAUSADOS.' });
    }
  });

  socket.on('retomar-disparos', ({ telefone }) => {
    const session = sessions.get(telefone);
    if (session) {
      session.isPaused = false;
      io.to(telefone).emit('log', { message: '▶️ Disparos RETOMADOS.' });
    }
  });

  socket.on('parar-disparos', ({ telefone }) => {
    const session = sessions.get(telefone);
    if (session) {
      session.shouldStop = true;
      io.to(telefone).emit('log', { message: '🛑 Solicitado PARADA dos disparos...' });
    }
  });

  socket.on('deslogar', async ({ telefone }) => {
    const session = sessions.get(telefone);
    if (session) {
      try {
        await session.client.logout();
        await session.client.close();
      } catch (error) {
        console.error(`Erro ao deslogar ${telefone}:`, error);
      } finally {
        sessions.delete(telefone);
        io.to(telefone).emit('status', 'disconnected');
        io.to(telefone).emit('log', { message: 'Desconectado com sucesso.' });
        console.log(`Cliente ${telefone} desconectado.`);
      }
    }
  });

  socket.on('buscar-contatos', async ({ telefone }) => {
    const session = sessions.get(telefone);
    if (!session) {
      socket.emit('log', { message: 'Erro: Sessão não encontrada!' });
      return;
    }

    io.to(telefone).emit('log', { message: '🔍 Buscando contatos do WhatsApp...' });

    try {
      const contacts = await session.client.getAllContacts();



      // Filtragem: Ignorar grupos, bloqueados e garantir que é usuário válido
      const validContacts = contacts.filter(c => {
        const isGroup = c.isGroup || c.isGroupMsg || (c.id && c.id.server === 'g.us');
        const server = c.id && c.id.server;

        return !isGroup && server === 'c.us' && !c.isBlocked;
      });



      // Mapeamento simplificado
      const simplifiedContacts = validContacts.map(c => ({
        id: c.id._serialized,
        name: c.name || c.pushname || c.formattedName || c.number || 'Sem Nome',
        number: c.number || c.id.user
      }));

      io.to(telefone).emit('receber-contatos', simplifiedContacts);
      io.to(telefone).emit('log', { message: `✅ ${simplifiedContacts.length} contatos encontrados!` });

    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      io.to(telefone).emit('log', { message: 'Erro ao buscar contatos: ' + error.message });
    }
  });

  socket.on('iniciar-disparos', async ({ telefone, mensagem, startAt, contatos }) => {
    const session = sessions.get(telefone);

    if (!session) {
      socket.emit('log', { message: 'Erro: Sessão não encontrada!' });
      return;
    }

    if (!contatos || !Array.isArray(contatos) || contatos.length === 0) {
      io.to(telefone).emit('log', { message: 'Erro: Nenhum contato selecionado!' });
      return;
    }

    const clientWpp = session.client;

    // Agendamento
    if (startAt) {

      const startTime = new Date(startAt).getTime();
      const now = Date.now();
      const delay = startTime - now;

      if (delay > 0) {
        const dateStr = new Date(startAt).toLocaleString();
        io.to(telefone).emit('log', { message: `⏳ Disparos agendados para: ${dateStr} (aguardando ${Math.round(delay / 1000)}s)` });

        await new Promise(resolve => setTimeout(resolve, delay));
        io.to(telefone).emit('log', { message: `⏰ Horário chegou! Iniciando disparos...` });
      } else {
        io.to(telefone).emit('log', { message: `⚠️ Horário agendado já passou. Iniciando imediatamente...` });
      }
    }

    try {
      io.to(telefone).emit('log', { message: `Iniciando disparos para ${contatos.length} contatos...` });

      session.isPaused = false;
      session.shouldStop = false;
      let report = [];

      let count = 0;


      // Helper para timeout
      const withTimeout = (promise, ms = 30000) => Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout no envio')), ms))
      ]);

      for (const contato of contatos) {
        if (session.shouldStop) {
          io.to(telefone).emit('log', { message: '🛑 Disparos INTERROMPIDOS pelo usuário.' });
          break;
        }

        while (session.isPaused) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (session.shouldStop) break;
        }
        if (session.shouldStop) {
          io.to(telefone).emit('log', { message: '🛑 Disparos INTERROMPIDOS pelo usuário.' });
          break;
        }

        const chatId = contato.id;
        const nome = contato.name;
        const numero = contato.number;



        try {
          // Envio direto sem verificação prévia para evitar travamentos

          const files = fs.readdirSync('./');
          // Busca mídia específica deste telefone
          const mediaFile = files.find(f => f.startsWith(`midia_${telefone}`));

          if (mediaFile) {
            const ext = path.extname(mediaFile).toLowerCase();
            const filePath = path.join(__dirname, mediaFile);


            if (['.mp3', '.ogg', '.wav'].includes(ext)) {
              await withTimeout(clientWpp.sendPtt(chatId, filePath));
              io.to(telefone).emit('log', { message: `Áudio enviado para ${nome}` });
              report.push({ telefone: numero, status: 'Sucesso', tipo: 'Áudio' });
              // Salva log detalhado
              saveLog(numero, 'Áudio PTT Enviado', 'Sucesso', mediaFile);
            } else {
              await withTimeout(clientWpp.sendFile(chatId, filePath, mediaFile, mensagem));
              io.to(telefone).emit('log', { message: `Mídia + Texto enviado para ${nome}` });
              report.push({ telefone: numero, status: 'Sucesso', tipo: 'Mídia+Texto' });
              // Salva log detalhado com mensagem completa e arquivo
              saveLog(numero, mensagem, 'Sucesso', mediaFile);
            }
          } else {

            await withTimeout(clientWpp.sendText(chatId, mensagem));
            io.to(telefone).emit('log', { message: `Texto enviado para ${nome}` });
            report.push({ telefone: numero, status: 'Sucesso', tipo: 'Texto' });
            saveLog(numero, mensagem, 'Sucesso');
          }

          count++;
          const progress = Math.round((count / contatos.length) * 100);
          io.to(telefone).emit('progress', { percent: progress, current: count, total: contatos.length });
          io.to(telefone).emit('log', { message: `Progresso: ${progress}% (${count}/${contatos.length})` });

          if (count < contatos.length) {
            const delay = Math.floor(Math.random() * (40000 - 15000 + 1) + 15000);
            io.to(telefone).emit('log', { message: `Aguardando ${delay / 1000}s...` });
            await new Promise(resolve => setTimeout(resolve, delay));
          }

        } catch (err) {
          console.error(`Erro ao enviar para ${numero}:`, err);
          io.to(telefone).emit('log', { message: `Falha ao enviar para ${nome}: ${err.message}` });
          report.push({ telefone: numero, status: 'Erro', erro: err.message });
          saveLog(numero, 'Erro: ' + err.message, 'Erro');
        }
      }

      io.to(telefone).emit('log', { message: 'Disparos finalizados! 🚀' });

      // Clean up media - SOMENTE APAGA SE FOR DIFERENTE DA MÍDIA ENVIADA NO BOT
      // Na verdade, como implementamos log de mídia, não podemos apagar a mídia IMEDIATAMENTE se quisermos ver no admin.
      // Vamos mudar a lógica para apagar apenas mídias muito antigas ou manter, já que o usuário pode querer ver.
      // Por simplicidade e pedido, vamos COMENTAR a deleção automática ou fazer uma limpeza baseada em tempo (cron) futuramente.
      // Para este passo, desabilitamos a remoção imediata para permitir visualização no admin.
      /*
     const files_cleanup = fs.readdirSync('./');
     files_cleanup.forEach(file => {
       if (file.startsWith(`midia_${telefone}`)) {
         // fs.unlinkSync(file); // Não apagar para permitir ver no admin
       }
     });
     */

      // Generate Report with Phone Number
      const reportName = `relatorio_${telefone}_${Date.now()}.csv`;
      const header = 'Telefone,Status,Tipo/Erro\n';
      const csvContent = header + report.map(r => `${r.telefone},${r.status},${r.tipo || r.erro}`).join('\n');
      fs.writeFileSync(`public/${reportName}`, csvContent);

      io.to(telefone).emit('report-ready', { url: reportName });
      io.to(telefone).emit('log', { message: 'Relatório gerado com sucesso!' });

    } catch (error) {
      console.error('Erro nos disparos:', error);
      io.to(telefone).emit('log', { message: 'Erro fatal nos disparos: ' + error.message });
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
