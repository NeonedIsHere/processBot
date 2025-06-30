const { EmbedBuilder } = require('@discordjs/builders')
const { ContainerBuilder, StringSelectMenuBuilder, SectionBuilder, TextDisplayBuilder, ButtonBuilder, MessageFlags, ActionRowBuilder } = require('discord.js')
const pm2 = require('pm2')
const { buildEmbedPage } = require('../core/fonction')

module.exports = {
    name: 'process',
    description: 'Affiche les informations du processus actuel.',
    permissions: 'Aucune',
    dm: true,
    options: [
        {
            name: 'version',
            description: null,
            type: 'subcommandgroup',
            options: [
                {
                    name: 'container',
                    description: 'Affiche la version conteneur.',
                    type: 'subcommand',
                    options: []
                },
                {
                    name: 'embed',
                    description: 'Affiche la version embed.',
                    type: 'subcommand',
                    options: []
                },
                {
                    name: 'text',
                    description: 'Affiche la version texte.',
                    type: 'subcommand',
                    options: []
                }
            ]
        },
        {
            name: 'actions',
            description: 'Affiche les actions du processus.',
            type: 'subcommandgroup',
            options: [
                {
                    name: "logs",
                    description: 'Affiche les logs du processus.',
                    type: 'subcommand',
                    options: []
                }
            ]
        },
    ],
    async execute(interaction, client) {
        const subcommandGroup = interaction.options.getSubcommandGroup()
        const subcommand = interaction.options.getSubcommand()

        if (!client.config.devId.includes(interaction.user.id)) {
            return interaction.reply({
                content: 'Cette commande est réservée aux développeurs.',
                flags: 64
            });
        }
 
        if (subcommandGroup === 'version') {
            if (subcommand === 'container') {
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

                    const container = new ContainerBuilder()
                        .setId(1)
                        .setAccentColor(0x5c1322)

                    const select = new StringSelectMenuBuilder()
                        .setCustomId('pm2_select')
                        .setPlaceholder('Sélectionnez un processus')
                        .addOptions(
                            list.map(proc => ({
                                label: proc.pm_id.toString(),
                                value: proc.pm_id.toString(),
                                description: `Nom: ${proc.name}, Statut: ${proc.pm2_env.status}`,
                                emoji: proc.pm2_env.status === 'online' ? '✅' : '❌'
                            }))
                        );

                    container.addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder()
                                    .setContent(`📊 Sélectionnez un process à gérer`)
                            )
                            .setButtonAccessory(select)
                    )

                    const section = new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder()
                                .setContent('Contrôles rapides')
                            );

                    section
                        .addButtonComponent(
                            new ButtonBuilder()
                                .setCustomId('pm2_restart')
                                .setLabel('Redémarrer')
                                .setStyle('Primary')
                                .setEmoji('🔄')
                        )
                        .addButtonComponent(
                            new ButtonBuilder()
                                .setCustomId('pm2_stop')
                                .setLabel('Arrêter')
                                .setStyle('Danger')
                                .setEmoji('🛑')
                        )
                        .addButtonComponent(
                            new ButtonBuilder()
                                .setCustomId('pm2_delete')
                                .setLabel('Supprimer')
                                .setStyle('Secondary')
                                .setEmoji('🗑️')
                        );

                    container.addSectionComponents(section);

                    await interaction.reply(
                        {
                            flags: MessageFlags.IsComponentsV2,
                            components: [container]
                        }
                    );
                });
            } else if (subcommand === 'embed') {

                pm2.connect((err) => {
                    if (err) {
                        console.error('Erreur de connexion à PM2:', err);
                        return interaction.reply({
                            content: 'Erreur de connexion à PM2.',
                            flags: 64
                        });
                    }

                })

                pm2.list(async (err, list) => {
                    if (err) {
                        console.error('Erreur lors de la récupération de la liste des processus:', err);
                        return interaction.reply({
                            content: 'Erreur lors de la récupération de la liste des processus.',
                            flags: 64
                        });
                    }

                    const currentPage = 1;
                    const { embed, rows } = await buildEmbedPage(list, currentPage)

                    interaction.reply({ embeds: [embed], components: rows });
                });
            }
        } else if (subcommandGroup === 'actions') {
            if (subcommand === 'logs') {
                
                await client.db.all('SELECT * FROM action_logs ORDER BY timestamp DESC LIMIT 3', async (err, row) => {
                    if (err) {
                        console.error('Erreur lors de la récupération des logs:', err);
                        return interaction.reply({
                            content: 'Erreur lors de la récupération des logs.',
                            flags: 64
                        });
                    }

                    const description = row.map(logs => [
                        `**Action:** ${logs.action}`,
                        `**Utilisateur:** <@${logs.user_id}>`,
                        `**ID du processus:** ${logs.process_id}`,
                        `**Nom du processus:** ${logs.process_name}`,
                        `**Timestamp:** ${new Date(logs.timestamp).toLocaleString()}`
                    ].join('\n'));

                    const embed = new EmbedBuilder()
                        .setTitle('Logs des actions')
                        .setDescription(description.join('\n\n') || 'Aucun log trouvé.')
                        .setColor(0xffffff)
                        .setTimestamp();

                    const buttonPerProcess = new ButtonBuilder()
                        .setCustomId('logs_process')
                        .setStyle('Secondary')
                        .setEmoji('📜');
                    const buttonPerAction = new ButtonBuilder()
                        .setCustomId('logs_action')
                        .setStyle('Secondary')
                        .setEmoji('🔍');
                    const buttonRefresh = new ButtonBuilder()
                        .setCustomId('logs_refresh')
                        .setStyle('Primary')
                        .setEmoji('🔄');
                    const buttonDelete = new ButtonBuilder()
                        .setCustomId('logs_delete')
                        .setStyle('Danger')
                        .setEmoji('🗑️')
                        .setDisabled(false);
                    
                        if (row.length === 0) {
                        embed.setDescription('Aucun log trouvé.');
                        buttonDelete.setDisabled(true);
                    }

                    const buttonRow = new ActionRowBuilder()
                        .addComponents(buttonPerProcess, buttonRefresh, buttonPerAction, buttonDelete);

                    interaction.reply({ embeds: [embed], components: [buttonRow] });
                });
            }
        }
    }
}