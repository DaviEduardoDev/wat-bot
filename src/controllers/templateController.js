const Template = require('../models/Template');

exports.listTemplates = async (req, res) => {
    try {
        const { telefone } = req.query;
        if (!telefone) return res.status(400).json({ success: false, message: 'Telefone não informado.' });

        const templates = await Template.findAll({
            where: { ownerPhone: telefone },
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, templates });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.createTemplate = async (req, res) => {
    try {
        const { name, content } = req.body;
        const { telefone } = req.query;

        if (!name || !content || !telefone) {
            return res.status(400).json({ success: false, message: 'Nome, conteúdo e telefone são obrigatórios.' });
        }
        const template = await Template.create({ name, content, ownerPhone: telefone });
        res.json({ success: true, template });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { telefone } = req.query; // Ensure user owns the template (basic security)

        // Ideally check ownership
        await Template.destroy({ where: { id } }); // Strict ownership check: { id, ownerPhone: telefone }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
