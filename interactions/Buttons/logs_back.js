const { ButtonBuilder, ActionRowBuilder } = require("discord.js");

module.exports = {
    customId: 'logs_back',
    async execute(interaction, client) {

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

        await interaction.update({
            components: [new ActionRowBuilder().addComponents(buttonPerProcess, buttonRefresh, buttonPerAction)]
        });
    }
}