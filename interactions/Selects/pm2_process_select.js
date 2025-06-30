const pm2 = require('pm2');
const { EmbedBuilder } = require('discord.js');
const { StringSelectMenuBuilder } = require('@discordjs/builders');
const { ButtonBuilder } = require('discord.js');
const { ActionRowBuilder } = require('@discordjs/builders');
const { logsAction } = require('../../core/fonction');

module.exports = {
    customId: 'pm2_process_select',
    async execute(interaction, client) {

        const selectedProcess = interaction.values[0];

        pm2.connect((err) => {
            if (err) {
                console.error('Erreur de connexion à PM2:', err);
                return interaction.reply({
                    content: 'Erreur de connexion à PM2.',
                    flags: 64
                });
            }

            pm2.describe(parseInt(selectedProcess), (err, processInfo) => {
                if (err) {
                    console.error('Erreur lors de la récupération des informations du processus:', err);
                    return interaction.reply({
                        content: 'Erreur lors de la récupération des informations du processus.',
                        flags: 64
                    });
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
                        `**Uptime:** \`${proc.pm2_env.pm_uptime ? new Date(proc.pm2_env.pm_uptime).toLocaleString('fr-FR') : 'N/A'}\``,
                        `**Path:** \`${proc.pm2_env.pm_cwd ?? 'N/A'}\``
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
                    )
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

                const selectRow = new ActionRowBuilder()
                    .addComponents(advanceSettingsSelect);
                const buttonRow = new ActionRowBuilder()
                    .addComponents(backButton, startButton, restartButton, stopButton);

                //logsAction(client, interaction.user.id, 'pm2_process_select', proc.pm_id, proc.name);
                pm2.disconnect();

                interaction.update({
                    embeds: [embed],
                    components: [selectRow, buttonRow]
                })
            })
        })
    }
}