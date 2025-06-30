const pm2 = require('pm2');
const { buildEmbedPage } = require('../../core/fonction');

module.exports = {
    customId: 'pm2_next',
    async execute(interaction) {
        const [_, actions, pageStr] = interaction.customId.split('_');
        let currentPage = parseInt(pageStr);

        const newPage = currentPage + 1;
        
        pm2.connect((err) => {
            if (err) {
                console.error('Erreur de connexion à PM2:', err);
                return interaction.reply({
                    content: 'Erreur de connexion à PM2.',
                    flags: 64
                });
            }

            pm2.list(async (err, list) => {
                if (err) {
                    console.error('Erreur lors de la récupération de la liste des processus:', err);
                    return interaction.reply({
                        content: 'Erreur lors de la récupération de la liste des processus.',
                        flags: 64
                    });
                }

                const { embed, rows } = await buildEmbedPage(list, newPage);
                await interaction.update({
                    embeds: [embed],
                    components: rows
                });
            });
        });
    }
};
 