const path = require('path');
const { loadCommands } = require('../core/fonction');

module.exports = (client) => {
    const commandsDir = path.join(__dirname, '../commands')
    loadCommands(commandsDir, client)
}