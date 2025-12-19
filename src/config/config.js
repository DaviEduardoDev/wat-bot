require('dotenv').config();
const path = require('path');

module.exports = {
    PORT: process.env.PORT || 3000,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '46894689',
    JWT_SECRET: process.env.JWT_SECRET || 'changeme_secret_key_123',
    HISTORY_FILE: path.resolve(__dirname, '../../history.json'),
    PUBLIC_DIR: path.resolve(__dirname, '../../public'),
    MEDIA_DIR: path.resolve(__dirname, '../../public/uploads'),
    SESSION_DATA_DIR: path.resolve(__dirname, '../../tokens'),
};
