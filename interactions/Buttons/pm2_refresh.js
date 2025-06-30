const { EmbedBuilder, StringSelectMenuBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const pm2 = require('pm2');
const { buildCommand, buildEmbedPage } = require('../../core/fonction');

module.exports = {
    customId: 'pm2_refresh',
    async execute(interaction) {
        pm2.connect((err) => {
            if (err) {
                console.error('Erreur de connexion à PM2:', err);
                return interaction.reply({
                    content: 'Erreur de connexion à PM2.',
                    flags: 64
                });
            }
        });

        pm2.list(async (err, list) => {
            if (err) {
                console.error('Erreur lors de la récupération de la liste des processus:', err);
                return interaction.reply({
                    content: 'Erreur lors de la récupération de la liste des processus.',
                    flags: 64
                });
            }

            
            const currentPage = 1;
            const { embed, rows } = await buildEmbedPage(list, currentPage);

            await interaction.update({
                embeds: [embed],
                components: rows
            });
        });
    }
}