const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Campaign = require('./Campaign');

const Job = sequelize.define('Job', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    recipientPhone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    recipientName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'SKIPPED'),
        defaultValue: 'PENDING'
    },
    scheduledAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    error: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    processedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

// Relationships
Campaign.hasMany(Job, { foreignKey: 'campaignId', onDelete: 'CASCADE' });
Job.belongsTo(Campaign, { foreignKey: 'campaignId' });

module.exports = Job;
