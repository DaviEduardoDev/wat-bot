const Log = require('../models/Log');

async function saveLog(telefone, mensagem, status, mediaFilename = null) {
    try {
        await Log.create({
            telefone,
            mensagem,
            status,
            mediaFilename
        });
    } catch (error) {
        console.error('Erro ao salvar log no banco:', error);
    }
}

const { Op } = require('sequelize');

async function getHistory(telefone = null, startDate = null, endDate = null) {
    try {
        const whereClause = {};

        if (telefone) {
            whereClause.telefone = telefone;
        }

        if (startDate || endDate) {
            whereClause.data = {};
            if (startDate) {
                const [year, month, day] = startDate.split('-').map(Number);
                const start = new Date(year, month - 1, day); // Local 00:00
                whereClause.data[Op.gte] = start;
            }
            if (endDate) {
                const [year, month, day] = endDate.split('-').map(Number);
                const end = new Date(year, month - 1, day);
                end.setHours(23, 59, 59, 999); // End of day
                whereClause.data[Op.lte] = end;
            }
        }

        const logs = await Log.findAll({
            where: whereClause,
            limit: 1000,
            order: [['data', 'DESC']]
        });
        // Normalize for frontend expectation (if needed, but sequelize returns objects)
        return logs.map(l => l.toJSON());
    } catch (e) {
        console.error('Erro ao buscar histórico:', e);
        return [];
    }
}

module.exports = {
    saveLog,
    getHistory
};
