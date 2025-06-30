const { EmbedBuilder } = require("discord.js");
const { buildLogsEmbed } = require("../../core/fonction");

module.exports = {
    customId: 'logs_refresh',
    async execute(interaction, client) {
        const logsPerPage = 5;
        const currentPage = 1;

        const isFiltered = interaction.customId.includes(':');

        if (isFiltered) {
            const selectedAction = interaction.customId.split(':')[1];

            client.db.all(
                `SELECT * FROM action_logs WHERE action = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
                [selectedAction, logsPerPage, 0],
                async (err, rows) => {
                    if (err) {
                        console.error('Erreur SQL :', err);
                        return interaction.reply({
                            content: 'Erreur lors du chargement des logs.',
                            ephemeral: true
                        });
                    }

                    const { embed, rows: components } = await buildLogsEmbed(rows, currentPage, selectedAction);
                    await interaction.update({ embeds: [embed], components });
                }
            );
        } else {
            client.db.all(
                `SELECT * FROM action_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
                [logsPerPage, 0],
                async (err, rows) => {
                    if (err) {
                        console.error('Erreur SQL :', err);
                        return interaction.reply({
                            content: 'Erreur lors du chargement des logs.',
                            ephemeral: true
                        });
                    }

                    const { embed, rows: components } = await buildLogsEmbed(rows, currentPage);
                    await interaction.update({ embeds: [embed], components });
                }
            );
        }
    }
};
