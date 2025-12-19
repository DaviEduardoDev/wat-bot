const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Log = sequelize.define('Log', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    telefone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mensagem: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mediaFilename: {
        type: DataTypes.STRING,
        allowNull: true
    },
    data: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Log;
