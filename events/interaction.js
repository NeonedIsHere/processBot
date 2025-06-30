const { Events, InteractionType, MessageFlags } = require('discord.js');
const { cp } = require('fs');

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction, client) {
        try {
            if (interaction.type === InteractionType.ApplicationCommand) {
                const command = client.commands.get(interaction.commandName);

                if (!command) {
                    console.error(`[Commands] Commande "${interaction.commandName}" non trouvée.`);
                    return interaction.reply({
                        content: `Cette commande est introuvable.`,
                        flags: MessageFlags.Ephemeral
                    });
                }

                const isDM = !interaction.inGuild()
                const context = command.contexts || ["DM", "GUILD"]

                if (isDM && !context.includes("DM")) {
                    return interaction.reply({
                        content: `Cette commande n'est pas disponible en DM.`,
                        flags: MessageFlags.Ephemeral
                    });
                }
                if (!isDM && !context.includes("GUILD")) {
                    return interaction.reply({
                        content: `Cette commande n'est pas disponible dans les serveurs.`,
                        flags: MessageFlags.Ephemeral
                    });
                }

                await command.execute(interaction, client);
            } 
            else if (interaction.type === InteractionType.MessageComponent) {
                if (interaction.isButton()) {
                    const buttonHandler = client.buttons.find(handler => interaction.customId.startsWith(handler.customId));

                    if (!buttonHandler) {
                        console.warn(`[Buttons] Aucun gestionnaire trouvé pour "${interaction.customId}".`);
                        return interaction.reply({
                            content: `Ce bouton n'est pas pris en charge.`,
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    await buttonHandler.execute(interaction, client);
                } else if (interaction.isStringSelectMenu()) {
                    const selectsHandler = client.selects?.find(handler => interaction.customId.startsWith(handler.customId));

                    if (!selectsHandler) {
                        console.warn(`[Select] Aucun gestionnaire trouvé pour "${interaction.customId}".`);
                        return interaction.reply({
                            content: `Ce bouton n'est pas pris en charge.`,
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    await selectsHandler.execute(interaction, client);
                }
            } 
            else if (interaction.type === InteractionType.ModalSubmit) {
                const modalHandler = client.modals?.get(interaction.customId);

                if (!modalHandler) {
                    console.warn(`[Modals] Aucun gestionnaire trouvé pour "${interaction.customId}".`);
                    return interaction.reply({
                        content: `Ce formulaire n'est pas pris en charge.`,
                        flags: MessageFlags.Ephemeral
                    });
                }

                await modalHandler.execute(interaction, client);
            } 
            else {
                console.error(`[Interactions] Type d'interaction "${interaction.type}" non géré.`);
            }
        } 
        catch (error) {
            console.error(`[Interactions] Erreur lors du traitement de l'interaction : ${error.message}\n${error.stack}`);
            if (interaction.replied || interaction.deferred) return;

            await interaction.reply({
                content: `Une erreur est survenue lors du traitement de votre interaction.`,
                flags: MessageFlags.Ephemeral
            });
        }   
    }
};
