const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js')

async function addOptions(builder, options) {
    options.forEach(option => {
        switch (option.type.toLowerCase()) {
            case 'string': 
                builder.addStringOption(opt => 
                    opt.setName(option.name)
                        .setDescription(option.description ?? 'Aucune description fournie')
                        .setRequired(option.required ?? false)
                        .setAutocomplete(option.autocomplete ?? false)
                        .addChoices(option.choice?.map(choice => ({
                            name: choice.name,
                            value: choice.value
                        })) ?? [])
                )
                break;
            case 'integer':
                builder.addIntegerOption(opt =>
                    opt.setName(option.name)
                        .setDescription(option.description ?? 'Aucune description fournie')
                        .setRequired(option.required ?? false)
                )
                break;
            case 'boolean':
                builder.addBooleanOption(opt =>
                    opt.setName(option.name)
                        .setDescription(option.description ?? 'Aucune description fournie')
                        .setRequired(option.required ?? false)
                )
                break;
            case 'user':
                builder.addUserOption(opt =>
                    opt.setName(option.name)
                        .setDescription(option.description ?? 'Aucune description fournie')
                        .setRequired(option.required ?? false)
                )
                break;
            case 'channel':
                builder.addChannelOption(opt =>
                    opt.setName(option.name)
                        .setDescription(option.description ?? 'Aucune description fournie')
                        .setRequired(option.required ?? false)
                )
                break;
            case 'role':
                builder.addRoleOption(opt =>
                    opt.setName(option.name)
                        .setDescription(option.description ?? 'Aucune description fournie')
                        .setRequired(option.required ?? false)
                )
                break;
            case 'mentionable':
                builder.addMentionableOption(opt =>
                    opt.setName(option.name)
                        .setDescription(option.description ?? 'Aucune description fournie')
                        .setRequired(option.required ?? false)
                )
                break;
            case 'number':
                builder.addNumberOption(opt =>
                    opt.setName(option.name)
                        .setDescription(option.description ?? 'Aucune description fournie')
                        .setRequired(option.required ?? false)
                )
                break;
            case 'attachment':
                builder.addAttachmentOption(opt =>
                    opt.setName(option.name)
                        .setDescription(option.description ?? 'Aucune description fournie')
                        .setRequired(option.required ?? false)
                )
                break;
            default:
                throw new Error(`Type d'option inconnu : ${option.type}`);
        }
    })
}

function buildCommand(command) {
    const slashCommand = new SlashCommandBuilder()
        .setName(command.name)
        .setDescription(command.description)
        .setDMPermission(command.dm ?? false)
        .setDefaultMemberPermissions(command.permissions === 'Aucune' ? null : command.permissions);

    if (command.options?.length > 0) {
        command.options.forEach(option => {
            if (option.type.toLowerCase() === 'subcommand') {
                slashCommand.addSubcommand(sub => {
                    sub.setName(option.name).setDescription(option.description ?? 'Aucune description.');
                    if (option.options?.length) {
                        addOptions(sub, option.options);
                    }
                    return sub; 
                });
            } else if (option.type.toLowerCase() === 'subcommandgroup') {
                slashCommand.addSubcommandGroup(group => {
                    group.setName(option.name).setDescription(option.description ?? 'Aucune description.');
                    if (option.options?.length) {
                        option.options.forEach(subcommand => {
                            group.addSubcommand(sub => {
                                sub.setName(subcommand.name).setDescription(subcommand.description ?? 'Aucune description.');
                                if (subcommand.options?.length) {
                                    addOptions(sub, subcommand.options);
                                }
                                return sub; 
                            });
                        });
                    }
                    return group;
                });
            } else {
                addOptions(slashCommand, [option]);
            }
        });
    }

    return slashCommand.toJSON();
}

async function buildEmbedPage(list, currentPage = 1, itemsPerPage = 3) {
    const totalPages = Math.max(Math.ceil(list.length / itemsPerPage), 1);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = list.slice(start, end);

    const description = pageItems.length > 0
        ? pageItems.map(proc =>
            `**Nom:** ${proc.name}\n**ID:** ${proc.pm_id}\n**Statut:** ${proc.pm2_env.status ?? 'Inconnu'}`
          ).join('\n\n')
        : "Aucun processus trouvé.";

    const embed = new EmbedBuilder()
        .setTitle(`Liste des processus (Page ${currentPage}/${totalPages})`)
        .setDescription(description)
        .setColor(0x5c1322)
        .setTimestamp()
        .setFooter({ text: `Page ${currentPage} sur ${totalPages}` });

    // Boutons
    const backButton = new ButtonBuilder()
        .setCustomId(`pm2_back_${currentPage}`)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⬅️')
        .setDisabled(currentPage === 1);

    const nextButton = new ButtonBuilder()
        .setCustomId(`pm2_next_${currentPage}`)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('➡️')
        .setDisabled(currentPage === totalPages);

    const refreshButton = new ButtonBuilder()
        .setCustomId(`pm2_refresh_${currentPage}`)
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔄');

    const rows = [];

    if (pageItems.length > 0) {
        const select = new StringSelectMenuBuilder()
            .setCustomId('pm2_process_select')
            .setPlaceholder('Sélectionnez un processus')
            .addOptions(
                pageItems.map(proc => ({
                    label: proc.name.slice(0, 100),
                    value: proc.pm_id.toString(),
                    emoji: proc.pm2_env.status === 'online' ? '✅' : '❌'
                }))
            );
        rows.push(new ActionRowBuilder().addComponents(select));

        rows.push(new ActionRowBuilder().addComponents(backButton, refreshButton, nextButton));
    } else {
        rows.push(new ActionRowBuilder().addComponents(refreshButton));
    }

    return { embed, rows };
}

/**
 * @param {Array} logs Liste des logs
 * @param {Number} currentPage Page actuelle
 * @param {String} selectedAction Action sélectionnée
 * @returns {Object} embed + composants
 */
async function buildLogsEmbed(logs, currentPage = 1, selectedAction = '') {
    const itemsPerPage = 5;
    const totalPages = Math.max(Math.ceil(logs.length / itemsPerPage), 1);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = logs.slice(start, end);

    const title = selectedAction ? `Logs de l'action \`${selectedAction.slice(4)}\` (Page ${currentPage}/${totalPages})` : 'Logs des actions';

    const embed = new EmbedBuilder()
        .setTitle(`${title} (Page ${currentPage}/${totalPages})`)
        .setColor(0xffffff)
        .setTimestamp()
        .setFooter({ text: `Page ${currentPage} sur ${totalPages}` });

    if (pageItems.length > 0) {
        const desc = pageItems.map(log => [
            `**Action:** ${log.action}`,
            `**Utilisateur:** <@${log.user_id}>`,
            `**ID du processus:** ${log.process_id ?? 'N/A'}`,
            `**Nom du processus:** ${log.process_name ?? 'N/A'}`,
            `**Timestamp:** ${new Date(log.timestamp).toLocaleString('fr-FR')}`
        ].join('\n'));
        embed.setDescription(desc.join('\n\n'));
    } else {
        embed.setDescription('Aucun log trouvé pour cette action.');
    }

    // 🔘 Boutons
    const refreshButton = new ButtonBuilder()
        .setCustomId(selectedAction ? `logs_refresh:${selectedAction}`: `logs_refresh`)
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔄');

    const backButton = new ButtonBuilder()
        .setCustomId(`logs_back:${selectedAction}`)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⬅️')
        .setDisabled(currentPage === 1);

    const nextButton = new ButtonBuilder()
        .setCustomId(`logs_next:${selectedAction}`)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('➡️')
        .setDisabled(currentPage === totalPages);

    const deleteButton = new ButtonBuilder()
        .setCustomId(`logs_delete:${selectedAction}`)
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️')
        .setDisabled(pageItems.length === 0);

    // 🔽 Menu pour rechanger d'action
    const allActions = ['pm2_start', 'pm2_stop', 'pm2_restart', 'pm2_delete', 'pm2_reload']; // adapte selon ce que tu veux afficher
    const select = new StringSelectMenuBuilder()
        .setCustomId('logs_action_select')
        .setPlaceholder('Changer de type d’action')
        .addOptions(
            allActions.map(action => ({
                label: action.slice(4),
                value: action,
                emoji: selectedAction === action ? '✅' : '📁',
                default: selectedAction === action
            }))
        );

    const rows = [
        new ActionRowBuilder().addComponents(select),
        new ActionRowBuilder().addComponents(backButton, refreshButton, nextButton, deleteButton)
    ];

    return { embed, rows };
}

async function loadCommands(dir, client) {
    const files = fs.readdirSync(dir)

    for (const file of files) {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
            loadCommands(fullPath, client)
        } else if (file.endsWith('.js')) {
            const command = require(fullPath)

            if (!command.name) {
                console.error(`Le fichier ${file} n'a pas de nom de commande défini.`);
                continue;
            }

            client.commands.set(command.name, command);
            console.log(`Commande ${command.name} chargée depuis ${fullPath}`);
        }
    }
}

async function loadEvents(dir, client) {
    const files = fs.readdirSync(dir)

    for (const file of files) {
        const fullPath = path.join(dir, file)
        const basePath = path.join(__dirname)
        const stat = fs.statSync (fullPath)

        if (stat.isDirectory()) {
            await loadEvents(fullPath, client)
        } else if (file.endsWith('.js')) {
            const event = require(fullPath)

            if (!event.name) {
                console.error(`Le fichier ${file} n'a pas de nom d'événement défini.`);
                continue;
            }

            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client))
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }

            client.events.set(event.name, event);
            console.log(`Événement ${event.name} chargé depuis ${path.relative(basePath, fullPath)}`);

        }
    }
}

function logsAction(client, userId, action, process_id = null, process_name = null) {
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString();
        const sql = `INSERT INTO action_logs (user_id, action, process_id, process_name, timestamp) VALUES (?, ?, ?, ?, ?)`;
        client.db.run(sql, [userId, action, process_id, process_name, timestamp], function(err) {
            if (err) {
                console.error('Erreur lors de l\'enregistrement de l\'action dans la base de données:', err);
                reject(err);
            } else {
                resolve(this.lastID)
                console.log(`Action enregistrée: ${action} par l'utilisateur ${userId} pour le processus ${process_name} (ID: ${process_id}) à ${timestamp}`);
            }
        });
    });
}

module.exports = {
    addOptions,
    buildCommand,
    buildEmbedPage,
    buildLogsEmbed,
    loadCommands,
    loadEvents,
    logsAction
}