const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    customId: 'logs_process',
    async execute(interaction, client) {
        try {
            client.db.all(
                `SELECT process_name, process_id FROM action_logs WHERE process_name IS NOT NULL ORDER BY process_id`,
                async (err, rows) => {
                    if (err) {
                        console.error('Erreur SQL :', err);
                        return interaction.reply({
                            content: 'Erreur lors de la récupération des processus.',
                            ephemeral: true
                        });
                    }

                    const unique = new Set();
                    const options = [];

                    for (const logs of rows) {
                        const value = logs.process_id.toString();
                        if (!unique.has(value)) {
                            unique.add(value);
                            options.push({
                                label: logs.process_name,
                                value: value,
                                emoji: { name: '🖥️' },
                            });
                        }
                    }

                    const select = new StringSelectMenuBuilder()
                        .setCustomId('logs_process_select')
                        .setPlaceholder('Sélectionnez un processus')
                        .addOptions(options);

                    const backButton = new ButtonBuilder()
                        .setCustomId('logs_back')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⬅️');

                    const buttonRow = new ActionRowBuilder()
                        .addComponents(backButton);
                    const selectRow = new ActionRowBuilder()
                        .addComponents(select);

                    await interaction.update({
                        components: [selectRow, buttonRow],
                    });
                }
            );
        } catch (err) {
            console.error('Erreur lors de l’exécution de logs_process :', err);
            interaction.reply({ content: 'Erreur interne.', ephemeral: true });
        }
    }
};
