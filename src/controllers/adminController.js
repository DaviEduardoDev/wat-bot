const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const { getHistory } = require('../utils/db');
const { sessions } = require('../store/sessionStore');
const jwt = require('jsonwebtoken');
const logAdminAction = require('../utils/adminLogger');
const AdminLog = require('../models/AdminLog'); // For fetching logs

exports.login = (req, res) => {
    const { password } = req.body;
    if (password === config.ADMIN_PASSWORD) {
        const token = jwt.sign({ id: 'admin', role: 'admin' }, config.JWT_SECRET, { expiresIn: '24h' });
        logAdminAction(req, 'LOGIN', 'Login realizado com sucesso');
        return res.json({ success: true, token });
    }
    logAdminAction(req, 'LOGIN_FAILED', `Tentativa de login com senha incorreta`);
    return res.status(401).json({ success: false, message: 'Senha incorreta' });
};

exports.getAdminStats = async (req, res) => {
    // Auth handled by middleware
    const telefone = req.query.telefone; // Optional filter
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let history = await getHistory(telefone, startDate, endDate);

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
    if (telefone) {
        // If filtering, only check specific session
        if (sessions.has(telefone)) {
            const session = sessions.get(telefone);
            let battery = 0;
            try {
                const info = await session.client.getHostDevice();
                battery = info && info.battery ? info.battery : 0;
            } catch (e) { }
            sessionData.push({ phone: telefone, battery, status: 'connected' });
        }
    } else {
        // Show all sessions
        for (const [phone, session] of sessions.entries()) {
            let battery = 0;
            try {
                const info = await session.client.getHostDevice();
                battery = info && info.battery ? info.battery : 0;
            } catch (e) { }

            sessionData.push({
                phone,
                battery,
                status: 'connected'
            });
        }
    }

    // Chart Data (Last 24h)
    const hours = {};
    const currentHour = hoje.getHours();
    for (let i = 0; i < 24; i++) {
        let h = currentHour - i;
        if (h < 0) h += 24;
        hours[h + 'h'] = 0;
    }

    history.forEach(h => {
        const d = new Date(h.data);
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
        logs: history.slice(0, 50),
        chartData: {
            labels: Object.keys(hours).reverse(),
            values: Object.values(hours).reverse()
        }
    });
};

exports.performAdminAction = async (req, res, io) => {
    const { action, phone } = req.body;
    // Auth handled by middleware

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
        logAdminAction(req, 'DISCONNECT', `Desconectou sessão ${phone}`);
        return res.json({ success: true, message: `Sessão ${phone} desconectada.` });
    }

    if (action === 'stop') {
        session.shouldStop = true;
        session.isPaused = false;
        io.to(phone).emit('log', { message: '🛑 Parada forçada pelo Admin.' });
        logAdminAction(req, 'STOP_CAMPAIGN', `Interrompeu disparos para ${phone}`);
        return res.json({ success: true, message: `Disparos para ${phone} interrompidos.` });
    }

    return res.status(400).json({ success: false, message: 'Ação desconhecida' });
};

exports.serveMedia = (req, res) => {
    // Auth handled by middleware
    const filename = req.params.filename;
    if (!filename.startsWith('midia_') || filename.includes('..') || filename.includes('/')) {
        return res.status(400).send('Arquivo inválido');
    }

    const filePath = path.join(config.MEDIA_DIR, filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Arquivo não encontrado');
    }
};

exports.serveAdminPage = (req, res) => {
    // This route serves the HTML. We might NOT want to protect this strictly with token in Header (browser limitation).
    // Instead, index.html/login.html logic handles it.
    // However, if we want to serve admin.html ONLY if authenticated via cookie, that's one way.
    // But sticking to the plan: admin.html is static-ish, the data is protected.
    // Actually, verifyToken middleware checks header OR query token. 
    // Usually for SPA/static, we serve the file publically, and it redirects if no token in localstorage.
    // So I will remove the password check here and just serve the file. 
    // Wait, serveAdminPage was protecting /admin.html access via ?senha.
    // Now /admin route will just serve the file. It's fine if anyone sees the empty skeleton.
    res.sendFile(path.join(config.PUBLIC_DIR, 'admin.html'));
};
exports.getSystemLogs = async (req, res) => {
    try {
        const logs = await AdminLog.findAll({
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json({ success: true, logs });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Erro ao buscar logs' });
    }
};
