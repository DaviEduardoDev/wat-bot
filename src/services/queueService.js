const { Op } = require('sequelize');
const Campaign = require('../models/Campaign');
const Job = require('../models/Job');
const Log = require('../models/Log');
const { sessions } = require('../store/sessionStore');
const config = require('../config/config');
const path = require('path');
const fs = require('fs');

let ioInstance = null;
let isProcessing = false;

// 15 to 40 seconds
const MIN_DELAY = 15000;
const MAX_DELAY = 40000;

function setIo(io) {
    ioInstance = io;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function createCampaign(senderPhone, message, mediaPath, contacts, scheduleTime = null) {
    const campaign = await Campaign.create({
        senderPhone,
        messageTemplate: message,
        mediaPath,
        status: 'PENDING',
        totalContacts: contacts.length
    });

    const jobs = contacts.map(c => ({
        campaignId: campaign.id,
        recipientPhone: c.number,
        recipientName: c.name,
        status: 'PENDING',
        scheduledAt: scheduleTime ? new Date(scheduleTime) : new Date()
    }));

    await Job.bulkCreate(jobs);
    return campaign;
}

async function processQueue() {
    if (isProcessing) return;
    isProcessing = true;

    try {
        while (true) {
            // 1. Check for active campaigns (not paused)
            const activeCampaigns = await Campaign.findAll({
                where: {
                    status: { [Op.in]: ['PENDING', 'PROCESSING'] }
                }
            });

            if (activeCampaigns.length === 0) {
                // No active campaigns, sleep 5s
                await sleep(5000);
                continue;
            }

            // 2. Pick next job
            // We join with Campaign to ensure we don't pick jobs from PAUSED campaigns
            const job = await Job.findOne({
                include: [{
                    model: Campaign,
                    where: { status: { [Op.in]: ['PENDING', 'PROCESSING'] } }
                }],
                where: {
                    status: 'PENDING',
                    scheduledAt: { [Op.lte]: new Date() }
                },
                order: [['scheduledAt', 'ASC']]
            });

            if (!job) {
                // No ready jobs, sleep 2s
                await sleep(2000);
                continue;
            }

            const campaign = job.Campaign;
            const senderPhone = campaign.senderPhone;
            const session = sessions.get(senderPhone);

            // 2.1 Check if session exists
            if (!session) {
                // Session dead for this campaign. Maybe pause it?
                console.log(`Sessão ${senderPhone} não encontrada para Job ${job.id}.`);
                // Only pause this campaign to not block others
                await campaign.update({ status: 'PAUSED' });
                if (ioInstance) {
                    ioInstance.to(senderPhone).emit('log', { message: '⚠️ Campanha pausada: Sessão WhatsApp desconectada.' });
                }
                continue;
            }

            // 2.1 Check if session is explicitly paused in memory (Legacy check, synced with DB ideally)
            if (session.isPaused) {
                // Update DB to reflect
                if (campaign.status !== 'PAUSED') await campaign.update({ status: 'PAUSED' });
                await sleep(2000);
                continue;
            }

            // 2.2 Mark Processing
            await job.update({ status: 'PROCESSING', processedAt: new Date() });
            if (campaign.status === 'PENDING') await campaign.update({ status: 'PROCESSING' });

            // 2.3 Send Message
            const clientWpp = session.client;

            try {
                if (ioInstance) ioInstance.to(senderPhone).emit('log', { message: `Enviando para ${job.recipientName}...` });

                const mediaFile = campaign.mediaPath;
                if (mediaFile) {
                    const ext = path.extname(mediaFile).toLowerCase();
                    const filePath = path.join(config.MEDIA_DIR, mediaFile);

                    if (fs.existsSync(filePath)) {
                        if (['.mp3', '.ogg', '.wav'].includes(ext)) {
                            await clientWpp.sendPtt(job.recipientPhone, filePath);
                            await Log.create({ telefone: job.recipientPhone, mensagem: 'Áudio PTT', status: 'Sucesso', mediaFilename: mediaFile });
                        } else {
                            await clientWpp.sendFile(job.recipientPhone, filePath, mediaFile, campaign.messageTemplate);
                            await Log.create({ telefone: job.recipientPhone, mensagem: campaign.messageTemplate, status: 'Sucesso', mediaFilename: mediaFile });
                        }
                    } else {
                        // Media missing fallback
                        await clientWpp.sendText(job.recipientPhone, campaign.messageTemplate);
                        await Log.create({ telefone: job.recipientPhone, mensagem: campaign.messageTemplate, status: 'Sucesso' });
                    }
                } else {
                    await clientWpp.sendText(job.recipientPhone, campaign.messageTemplate);
                    await Log.create({ telefone: job.recipientPhone, mensagem: campaign.messageTemplate, status: 'Sucesso' });
                }

                await job.update({ status: 'COMPLETED' });
                if (ioInstance) ioInstance.to(senderPhone).emit('log', { message: `✅ Enviado para ${job.recipientName}` });

            } catch (err) {
                console.error(`Falha no Job ${job.id}:`, err);
                await job.update({ status: 'FAILED', error: err.message });
                await Log.create({ telefone: job.recipientPhone, mensagem: 'Erro: ' + err.message, status: 'Erro' });
                if (ioInstance) ioInstance.to(senderPhone).emit('log', { message: `❌ Falha para ${job.recipientName}: ${err.message}` });
            }

            // 2.4 Update Counters
            await campaign.increment('processedCount');

            // 2.5 Emit Progress
            // Recalculate progress
            const processed = campaign.processedCount + 1; // +1 because increment is async/lazy? better use the value we just incremented
            const total = campaign.totalContacts;
            const percent = Math.round((processed / total) * 100);

            if (ioInstance) {
                ioInstance.to(senderPhone).emit('progress', { percent, current: processed, total });
            }

            // 2.6 Check Completion
            if (processed >= total) {
                await campaign.update({ status: 'COMPLETED' });
                if (ioInstance) ioInstance.to(senderPhone).emit('log', { message: `🚀 Campanha Finalizada!` });

                // Generate Report
                try {
                    const allJobs = await Job.findAll({ where: { campaignId: campaign.id } });
                    const csvLines = ['Nome,Telefone,Status,Erro,Data']; // Header

                    allJobs.forEach(job => {
                        const dateStr = job.updatedAt ? new Date(job.updatedAt).toLocaleString() : '';
                        // Escape fields just in case
                        const name = `"${(job.recipientName || '').replace(/"/g, '""')}"`;
                        const status = job.status === 'COMPLETED' ? 'Sucesso' : job.status; // Match reportController expectation
                        const error = `"${(job.error || '').replace(/"/g, '""')}"`;

                        csvLines.push(`${name},${job.recipientPhone},${status},${error},${dateStr}`);
                    });

                    const filename = `relatorio_${senderPhone}_${Date.now()}.csv`;
                    const filePath = path.join(config.PUBLIC_DIR, filename);

                    fs.writeFileSync(filePath, csvLines.join('\n'));

                    if (ioInstance) {
                        ioInstance.to(senderPhone).emit('report-ready', { url: `/${filename}` });
                        ioInstance.to(senderPhone).emit('log', { message: `📄 Relatório gerado: ${filename}` });
                    }
                } catch (reportErr) {
                    console.error('Erro ao gerar relatório:', reportErr);
                    if (ioInstance) ioInstance.to(senderPhone).emit('log', { message: `⚠️ Erro ao gerar relatório CSV.` });
                }

            } else {
                // 2.7 Variable Delay
                const delay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1) + MIN_DELAY);
                if (ioInstance) ioInstance.to(senderPhone).emit('log', { message: `⏳ Aguardando ${Math.round(delay / 1000)}s...` });
                await sleep(delay);
            }
        }
    } catch (criticalErr) {
        console.error('Critical Queue Error:', criticalErr);
        isProcessing = false;
        // Auto-restart wrapper could go here, for now rely on next loop trigger or PM2
    }
}

// Commands
async function pauseCampaign(senderPhone) {
    // Pause all running campaigns for this phone
    await Campaign.update({ status: 'PAUSED' }, {
        where: { senderPhone, status: 'PROCESSING' }
    });
}

async function resumeCampaign(senderPhone) {
    await Campaign.update({ status: 'PROCESSING' }, {
        where: { senderPhone, status: 'PAUSED' }
    });
}

async function stopCampaign(senderPhone) {
    // Cancel logic
    await Campaign.update({ status: 'CANCELLED' }, {
        where: { senderPhone, status: { [Op.in]: ['PROCESSING', 'PAUSED', 'PENDING'] } }
    });
}

module.exports = {
    setIo,
    createCampaign,
    processQueue,
    pauseCampaign,
    resumeCampaign,
    stopCampaign
};
