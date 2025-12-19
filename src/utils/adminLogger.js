const AdminLog = require('../models/AdminLog');

async function logAdminAction(req, action, details) {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        let detailsStr = details;
        if (typeof details === 'object') {
            detailsStr = JSON.stringify(details);
        }

        await AdminLog.create({
            ip,
            action,
            details: detailsStr,
            adminId: req.userId || 'system'
        });
    } catch (error) {
        console.error('Erro ao salvar log administrativo:', error);
    }
}

module.exports = logAdminAction;
