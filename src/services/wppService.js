const wppconnect = require('@wppconnect-team/wppconnect');
const { sessions, initializingSessions } = require('../store/sessionStore');
const config = require('../config/config');
const fs = require('fs');
const path = require('path');

async function createSession(telefone, io) {
    if (!telefone) return;

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

    // Clean up old tokens to prevent corruption
    const tokenDir = path.join(__dirname, `../../tokens/session-${telefone}`);
    if (fs.existsSync(tokenDir)) {
        try {
            fs.rmSync(tokenDir, { recursive: true, force: true });
            io.to(telefone).emit('log', { message: 'Tokens antigos limpos com sucesso.' });
        } catch (e) {
            console.error('Erro ao limpar tokens:', e);
        }
    }

    try {
        const client = await wppconnect.create({
            session: `session-${telefone}`,
            phoneNumber: telefone,
            usePairingCode: true,
            // whatsappVersion: '2.2412.54', // REMOVED to let it auto-update
            headless: true,
            useChrome: true,
            logQR: false,
            autoClose: 0,
            disableWelcome: true,
            puppeteerOptions: {
                userDataDir: `./tokens/session-${telefone}`,
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
                // Emit QR Code to frontend as fallback
                io.to(telefone).emit('qr-code', base64Qr);
                io.to(telefone).emit('log', { message: 'QR Code gerado (fallback). Escaneie se o código não aparecer.' });
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

        // Polling connection check
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
                // Ignore errors if client not ready
            }
        }, 3000);

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
}

async function cancelSession(telefone) {
    if (!telefone) return;

    console.log(`Cancelando sessão para ${telefone}...`);

    // Remove initialization lock
    initializingSessions.delete(telefone);

    // If there is an active session, close it
    if (sessions.has(telefone)) {
        const session = sessions.get(telefone);
        try {
            await session.client.close();
        } catch (error) {
            console.error('Erro ao fechar sessão cancelada:', error);
        }
        sessions.delete(telefone);
    }
}

module.exports = {
    createSession,
    cancelSession
};
