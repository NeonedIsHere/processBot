const { TextInputBuilder } = require('@discordjs/builders');
const { ActionRowBuilder } = require('@discordjs/builders');
const { ModalBuilder } = require('@discordjs/builders');
const pm2 = require('pm2');
const { buildEmbedPage, logsAction } = require('../../core/fonction');
const { existsSync, readFileSync } = require('fs');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    customId: "pm2_advanced_settings",
    async execute(interaction, client) {
        const selected = interaction.values[0]

        if (selected === 'rename') {
            const modal = new ModalBuilder()
                .setCustomId('pm2_rename_modal')
                .setTitle('Renommer le processus PM2');

            const input = new TextInputBuilder()
                .setCustomId('pm2_rename_input')
                .setLabel('Nouveau nom du processus')
                .setStyle('Short')
                .setRequired(true)
                .setMaxLength(50);

            const row = new ActionRowBuilder()
                .addComponents(input);

            modal.addComponents(row);

            await interaction.showModal(modal);
        } else if (selected === 'delete') {
            const procId = interaction.message.embeds[0]?.data?.description?.match(/\*\*ID:\*\* (\d+)/)?.[1];

            if (!procId) {
                return interaction.reply({
                    content: '❌ Impossible de trouver l’ID du process.',
                    ephemeral: true
                });
            }

            pm2.connect((err) => {
                if (err) {
                    console.error('Erreur de connexion à PM2:', err);
                    return interaction.reply({
                        content: '❌ Erreur de connexion à PM2.',
                        ephemeral: true
                    });
                }

                pm2.delete(parseInt(procId), (err) => {
                    if (err) {
                        console.error('Erreur lors de la suppression du processus:', err);
                        pm2.disconnect();
                        return interaction.reply({
                            content: '❌ Erreur lors de la suppression du processus.',
                            ephemeral: true
                        });
                    }

                    pm2.list(async (err, list) => {
                        if (err) {
                            console.error('Erreur lors de la récupération de la liste des processus:', err);
                            pm2.disconnect();
                            return interaction.reply({
                                content: '❌ Erreur lors de la récupération de la liste des processus.',
                                ephemeral: true
                            });
                        }

                        const { embed, rows } = await buildEmbedPage(list, 1);

                        logsAction(client, interaction.user.id, 'pm2_delete', proc.pm_id, proc.name);
                        pm2.disconnect();

                        await interaction.update({
                            embeds: [embed],
                            components: rows,
                            flags: 64
                        });
                    });
                });
            });
        } else if (selected === 'logs') {
            pm2.connect((err) => {
                if (err) {
                    console.error('Erreur de connexion à PM2:', err);
                    return interaction.reply({
                        content: '❌ Erreur de connexion à PM2.',
                        ephemeral: true
                    });
                }

                const procId = interaction.message.embeds[0]?.data?.description?.match(/\*\*ID:\*\* (\d+)/)?.[1];

                pm2.describe(procId, (err, processInfo) => {
                    if (err) {
                        console.error('Erreur lors de la récupération des informations du processus:', err);
                        pm2.disconnect();
                        return interaction.reply({
                            content: '❌ Erreur lors de la récupération des informations du processus.',
                            ephemeral: true
                        });
                    }

                    const logäth = processInfo[0].pm2_env.pm_out_log_path

                    if (!existsSync(logäth)) {
                        pm2.disconnect();
                        return interaction.reply({
                            content: '❌ Le fichier de log n’existe pas.',
                            ephemeral: true
                        });
                    }

                    const logs = readFileSync(logäth, 'utf-8')
                    const lines = logs.trim().split('\n');
                    const lastLines = lines.slice(-15).join('\n');

                    const embed = new EmbedBuilder()
                        .setTitle(`Logs du processus ${processInfo[0].name}`)
                        .setDescription(`\`\`\`bash\n${lastLines}\n\`\`\``)
                        .setColor('Blurple')
                        .setTimestamp();

                    logsAction(client, interaction.user.id, 'pm2_logs', processInfo[0].pm_id, processInfo[0].name);

                    pm2.disconnect();

                    return interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                })
            })
        }
    },
};