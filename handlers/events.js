const path = require('path');
const { loadEvents } = require('../core/fonction');

module.exports = (client) => {
    const eventDir = path.join(__dirname, '../events');
    loadEvents(eventDir, client);
}