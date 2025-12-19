const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdminLog = sequelize.define('AdminLog', {
    ip: {
        type: DataTypes.STRING,
        allowNull: true
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false
    },
    details: {
        type: DataTypes.TEXT, // Using TEXT to store JSON string or simple text
        allowNull: true
    },
    adminId: {
        type: DataTypes.STRING, // Store who performed it (e.g. 'admin' or userId)
        allowNull: true
    }
}, {
    timestamps: true, // Adds createdAt, updatedAt
    updatedAt: false // We only care about creation time really
});

module.exports = AdminLog;
