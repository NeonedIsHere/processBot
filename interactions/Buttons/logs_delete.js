const { buildLogsEmbed } = require("../../core/fonction");
const { EmbedBuilder } = require("discord.js");

module.exports = {
    customId: 'logs_delete',
    async execute(interaction, client) {
        const customId = interaction.customId
        const parts = customId.split(':');
        const action = parts[1];

        if (action) {
            client.db.run(
                `DELETE FROM action_logs WHERE action = ?`,
                [action],
                async (err) => {
                    if (err) {
                        console.error('Erreur SQL :', err);
                        return interaction.reply({
                            content: 'Erreur lors de la suppression des logs.',
                            ephemeral: true
                        });
                    }

                    const { embed, rows: components } = await buildLogsEmbed([], 1, action);
                    await interaction.update({
                        embeds: [embed],
                        components: components
                    });
                }
            )
        } else {
            client.db.run(
                `DELETE FROM action_logs`,
                [],
                async (err) => {
                    if (err) {
                        console.error('Erreur SQL :', err);
                        return interaction.reply({
                            content: 'Erreur lors de la suppression des logs.',
                            ephemeral: true
                        });
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Logs des actions')
                        .setDescription('Aucun log trouvé.')
                        .setColor(0xffffff)
                        .setTimestamp();

                    await interaction.update({
                        embeds: [embed],
                        components: []
                    });
                }
            );
        }
    }
}