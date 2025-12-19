const path = require('path');
const fs = require('fs');
const config = require('../config/config');

exports.handleUpload = (req, res, io) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
    }

    const telefone = req.query.telefone;
    if (!telefone) return res.status(400).json({ success: false, message: 'Telefone não informado.' });

    // Clean up old media for this phone number
    try {
        const files = fs.readdirSync(config.MEDIA_DIR);
        files.forEach(file => {
            if (file.startsWith(`midia_${telefone}_`) && file !== req.file.filename) {
                fs.unlinkSync(path.join(config.MEDIA_DIR, file));
                console.log(`Mídia antiga removida: ${file}`);
            }
        });
    } catch (e) {
        console.error('Erro ao limpar mídias antigas:', e);
    }

    console.log(`Mídia recebida de ${telefone}!`);
    const ext = path.extname(req.file.originalname);

    // Notify via socket
    if (io) {
        io.to(telefone).emit('log', { message: `Mídia (${ext}) carregada com sucesso!` });
    }

    res.json({ success: true, message: 'Mídia carregada com sucesso!', type: ext });
};

exports.listMedia = (req, res) => {
    try {
        const files = fs.readdirSync(config.MEDIA_DIR);
        // Filter only allowed media extensions
        const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mp3', '.pdf', '.ogg', '.webp'];
        const mediaFiles = files
            .filter(f => allowedExts.includes(path.extname(f).toLowerCase()))
            .map(f => ({
                name: f,
                url: `/uploads/${f}`
            }));
        res.json({ success: true, files: mediaFiles });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteMedia = (req, res) => {
    try {
        const { filename } = req.params;
        const { telefone } = req.query;

        if (!telefone) return res.status(400).json({ success: false, message: 'Telefone não informado.' });
        if (!filename.startsWith(`midia_${telefone}_`)) {
            return res.status(403).json({ success: false, message: 'Acesso negado a este arquivo.' });
        }

        const filePath = path.join(config.MEDIA_DIR, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'Arquivo não encontrado.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
