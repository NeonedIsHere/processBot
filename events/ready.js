module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Bot is ready! Logged in as ${client.user.tag}`);
    }
}