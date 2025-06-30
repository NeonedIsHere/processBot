const { REST, Routes } = require('discord.js');
const { buildCommand } = require('../core/fonction');

module.exports = async (client) => {
    const commands = client.commands.map(command => {
        return buildCommand(command)
    }).filter(Boolean)

    const rest = new REST({  version: '10'}).setToken(client.config.token)

    try {
        await rest.put(Routes.applicationCommands(client.config.clientId), { body: commands })
        console.log(`Successfully registered ${commands.length} application commands.`)
    } catch (error) {
        console.error('Error registering application commands:', error);
        return
    }
}