const fs = require('fs');
const path = require('path');
const config = require('../config/config');

exports.getStats = (req, res) => {
    const telefone = req.query.telefone;
    if (!telefone) return res.status(400).json({ success: false, message: 'Telefone não informado.' });

    try {
        const publicDir = config.PUBLIC_DIR;
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
};
