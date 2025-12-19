const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const config = require('./config/config');
const apiRoutes = require('./routes/apiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const socketManager = require('./socket/socketManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.json());
app.use(express.static(config.PUBLIC_DIR));

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// Socket.io
socketManager(io);

const sequelize = require('./config/database');
const queueService = require('./services/queueService');

async function start() {
    try {
        await sequelize.sync(); // Create tables if they don't exist
        console.log('📦 Banco de Dados Sincronizado.');
    } catch (err) {
        console.error('Erro ao sincronizar banco:', err);
    }

    const httpServer = server.listen(config.PORT, () => {
        console.log(`Servidor rodando em http://localhost:${config.PORT}`);

        // Start Queue Processor
        queueService.setIo(app.get('io')); // get io from app (set in line 19)
        queueService.processQueue();
        console.log('🔄 Fila de Processamento Iniciada.');
    });

    httpServer.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            console.error(`\n❌ ERRO: A porta ${config.PORT} já está em uso!`);
            console.error(`👉 Provavelmente outra instância do bot ou outro serviço está rodando.`);
            console.error(`👉 Tente parar o processo conflitante (ex: 'pm2 delete all' ou verifique o Gerenciador de Tarefas).\n`);
            process.exit(1);
        } else {
            console.error('Erro no servidor:', e);
        }
    });
}

module.exports = { start };
