const { EmbedBuilder } = require("discord.js");
const { buildLogsEmbed } = require("../../core/fonction");

module.exports = {
    customId: 'logs_action_select',
    async execute(interaction, client) {
        let selectedAction = interaction.values[0];

        if (!selectedAction.startsWith('pm2_')) {
            selectedAction = `pm2_${selectedAction}`
        }


        const logsPerPage = 5;
        const currentPage = 1;

        client.db.all(
            `SELECT * FROM action_logs WHERE action = ? ORDER BY timestamp DESC LIMIT ?`,
            [selectedAction, logsPerPage],
            async (err, rows) => {
                if (err) {
                    console.error('Erreur SQL :', err);
                    return interaction.reply({
                        content: 'Erreur lors de la récupération des logs.',
                        ephemeral: true
                    });
                }

                const { embed, rows: components } = await buildLogsEmbed(rows, currentPage, selectedAction);

                await interaction.update({ embeds: [embed], components });
            }
        )
    }
}