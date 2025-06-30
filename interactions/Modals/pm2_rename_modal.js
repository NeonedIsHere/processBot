const { EmbedBuilder } = require('discord.js');
const pm2 = require('pm2');
const { logsAction } = require('../../core/fonction');

module.exports = {
    customId: 'pm2_rename_modal',
    async execute(interaction, client) {
        const newName = interaction.fields.getTextInputValue('pm2_rename_input');
        const oldEmbed = interaction.message.embeds[0];

        const procId = oldEmbed?.description?.match(/\*\*ID:\*\* (\d+)/)?.[1];

        if (!procId) {
            return interaction.reply({
                content: '❌ Impossible de trouver l’ID du process.',
                ephemeral: true
            });
        }

        pm2.connect(async (err) => {
            if (err) {
                console.error('Erreur de connexion à PM2:', err);
                return interaction.reply({
                    content: '❌ Erreur de connexion à PM2.',
                    ephemeral: true
                });
            }

            pm2.restart(Number(procId), { name: newName }, (restartErr) => {
                if (restartErr) {
                    console.error('Erreur lors du renommage du process:', restartErr);
                    pm2.disconnect();
                    return interaction.reply({
                        content: '❌ Erreur lors du renommage.',
                        ephemeral: true
                    });
                }

                // Récupérer les infos fraîches du process
                pm2.describe(Number(procId), async (descErr, processDescription) => {
                    if (descErr || !processDescription || !processDescription[0]) {
                        console.error('Erreur lors de la récupération du process:', descErr);
                        pm2.disconnect();
                        return interaction.reply({
                            content: '❌ Impossible de récupérer les infos du process après renommage.',
                            ephemeral: true
                        });
                    }

                    const proc = processDescription[0];

                    const updatedEmbed = new EmbedBuilder()
                        .setColor('Green')
                        .setTitle('Informations sur le processus')
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
                        .setTimestamp();

                    logsAction(client, interaction.user.id, `pm2_rename`, proc.pm_id, proc.name);

                    await interaction.update({
                        embeds: [updatedEmbed],
                        ephemeral: true
                    });

                    pm2.disconnect();
                });
            });
        });
    }
};