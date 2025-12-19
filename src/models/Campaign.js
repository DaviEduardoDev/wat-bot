const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Campaign = sequelize.define('Campaign', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    senderPhone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    messageTemplate: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    mediaPath: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'PAUSED', 'CANCELLED'),
        defaultValue: 'PENDING'
    },
    totalContacts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    processedCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Campaign;
