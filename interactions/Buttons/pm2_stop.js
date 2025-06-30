const pm2 = require('pm2');
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const { StringSelectMenuBuilder } = require('@discordjs/builders');
const { logsAction } = require('../../core/fonction');

module.exports = {
    customId: 'pm2_stop',
    async execute(interaction, client) {
        const procId = interaction.message.embeds[0]?.data?.description?.match(/\*\*ID:\*\* (\d+)/)?.[1];

        if (!procId) {
            return interaction.reply({
                content: 'Aucun ID de processus trouvé dans le message.',
                ephemeral: true
            });
        }

        pm2.connect((err) => {
            if (err) {
                console.error('Erreur de connexion à PM2:', err);
                return interaction.reply({ content: 'Erreur de connexion à PM2.', ephemeral: true });
            }

            pm2.stop(parseInt(procId), (err) => {
                if (err) {
                    console.error('Erreur lors de l\'arrêt du processus:', err);
                    return interaction.reply({ content: 'Erreur lors de l\'arrêt du processus.', ephemeral: true });
                }

                pm2.describe(parseInt(procId), (err, processInfo) => {
                    if (err) {
                        console.error('Erreur récupération infos:', err);
                        return interaction.reply({ content: 'Erreur lors de la mise à jour.', ephemeral: true });
                    }

                    const proc = processInfo[0];

                    const embed = new EmbedBuilder()
                        .setTitle(`Informations sur le processus: ${proc.name}`)
                        .setDescription([
                            `**Nom:** ${proc.name}`,
                            `**ID:** ${proc.pm_id}`,
                            `**Statut:** ${proc.pm2_env.status}`,
                            `**PID:** ${proc.pid ?? 'N/A'}`,
                            `**Mémoire:** ${proc.monit?.memory ? (proc.monit.memory / 1024 / 1024).toFixed(2) + ' Mo' : 'N/A'}`,
                            `**CPU:** ${proc.monit?.cpu ? proc.monit.cpu.toFixed(1) + '%' : 'N/A'}`,
                            `**Uptime:** ${proc.pm2_env.pm_uptime ? new Date(proc.pm2_env.pm_uptime).toLocaleString() : 'N/A'}`,
                            `**Path:** ${proc.pm2_env.pm_cwd ?? 'N/A'}`
                        ].join('\n'))
                        .setColor(proc.pm2_env.status === 'online' ? 'Green' : 'Red')
                        .setTimestamp();

                    const advanceSettingsSelect = new StringSelectMenuBuilder()
                        .setCustomId('pm2_advanced_settings')
                        .setPlaceholder('Sélectionnez un paramètre avancé')
                        .setDisabled(false)
                        .setOptions(
                            { label: 'Renommer', value: 'rename', emoji: { name: '✏️' } },
                            { label: 'Supprimer', value: 'delete', emoji: { name: '🗑️' } },
                            { label: 'Logs', value: 'logs', emoji: { name: '📜' } },
                        );

                    const startButton = new ButtonBuilder()
                        .setCustomId('pm2_start')
                        .setStyle('Success')
                        .setEmoji('💚')
                        .setDisabled(proc.pm2_env.status === 'online');
                    const restartButton = new ButtonBuilder()
                        .setCustomId('pm2_restart')
                        .setStyle('Secondary')
                        .setEmoji('🩶')
                        .setDisabled(proc.pm2_env.status !== 'online');
                    const stopButton = new ButtonBuilder()
                        .setCustomId('pm2_stop')
                        .setStyle('Danger')
                        .setEmoji('❤️')
                        .setDisabled(proc.pm2_env.status === 'stopped');

                    const backButton = new ButtonBuilder()
                        .setCustomId('pm2_refresh')
                        .setEmoji('⬅️')
                        .setStyle('Primary');

                    logsAction(client, interaction.user.id, 'pm2_stop', proc.pm_id, proc.name);

                    interaction.update({
                        embeds: [embed],
                        components: [
                            new ActionRowBuilder().addComponents(advanceSettingsSelect),
                            new ActionRowBuilder().addComponents(backButton, startButton, restartButton, stopButton),
                        ]
                    });
                });
            });
        });
    }
};
