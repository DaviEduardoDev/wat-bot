const { sessions, initializingSessions } = require('../store/sessionStore');
const wppService = require('../services/wppService');
const queueService = require('../services/queueService');
const fs = require('fs');
const path = require('path');
const { saveLog } = require('../utils/db');
const config = require('../config/config');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('Novo cliente conectado:', socket.id);

        socket.on('iniciar-sessao', async ({ telefone }) => {
            if (!telefone) return;
            socket.join(telefone);
            await wppService.createSession(telefone, io);
        });

        socket.on('pausar-disparos', async ({ telefone }) => {
            await queueService.pauseCampaign(telefone);
            io.to(telefone).emit('log', { message: '⏸️ Campanha PAUSADA.' });
        });

        socket.on('retomar-disparos', async ({ telefone }) => {
            await queueService.resumeCampaign(telefone);
            io.to(telefone).emit('log', { message: '▶️ Campanha RETOMADA.' });
        });

        socket.on('parar-disparos', async ({ telefone }) => {
            await queueService.stopCampaign(telefone);
            io.to(telefone).emit('log', { message: '🛑 Campanha CANCELADA.' });
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

        socket.on('cancelar-sessao', async ({ telefone }) => {
            await wppService.cancelSession(telefone);
            socket.emit('log', { message: 'Tentativa de conexão cancelada.' });
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
                const validContacts = contacts.filter(c => {
                    const isGroup = c.isGroup || c.isGroupMsg || (c.id && c.id.server === 'g.us');
                    const server = c.id && c.id.server;
                    return !isGroup && server === 'c.us' && !c.isBlocked;
                });

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

            // Scheduling
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
                // Determine media path
                let mediaPath = null;
                const files = fs.readdirSync(config.MEDIA_DIR);
                const mediaFile = files.find(f => f.startsWith(`midia_${telefone}_`));
                if (mediaFile) mediaPath = mediaFile;

                io.to(telefone).emit('log', { message: `Agendando ${contatos.length} mensagens na fila...` });

                await queueService.createCampaign(telefone, mensagem, mediaPath, contatos, startAt);

                io.to(telefone).emit('log', { message: '🚀 Campanha criada com sucesso! O sistema processará em segundo plano.' });
                // Note: The loop is now in queueService, independent of this socket event.

            } catch (error) {
                console.error('Erro ao criar campanha:', error);
                io.to(telefone).emit('log', { message: 'Erro ao criar campanha: ' + error.message });
            }
        });
    });
};
