const jwt = require('jsonwebtoken');
const config = require('../config/config');

const verifyToken = (req, res, next) => {
    // Check header or query param (for media/compatibility)
    let token = req.headers['authorization'];

    if (!token && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(403).json({ success: false, message: 'Nenhum token fornecido.' });
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: 'Token inválido ou expirado.' });
        }
        req.userId = decoded.id;
        next();
    });
};

module.exports = verifyToken;
