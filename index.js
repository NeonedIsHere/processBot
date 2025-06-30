const { Client, IntentsBitField, Collection, GatewayIntentBits } = require('discord.js')
const config = require('./config.json')
const db = require('./data/database')

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        'CHANNEL',
        'GUILD_MEMBER',
        'GUILD_SCHEDULED_EVENT',
        'MESSAGE',
        'REACTION',
        'USER',
        'GUILD_INVITE',
        'GUILD_EMOJI_AND_STICKER',
        'GUILD_WEBHOOK',
        'GUILD_VOICE_STATE',
        'GUILD_MEMBER_VERIFICATION_FORM',
        'GUILD_INTEGRATION',
        'GUILD_MODERATION',
        'GUILD_MESSAGE_TYPING',
        'DIRECT_MESSAGE',
        'DIRECT_MESSAGE_REACTION',
        'DIRECT_MESSAGE_TYPING',
        'DIRECT_MESSAGE_EMOJI_AND_STICKER'
    ]
})

client.config = config
client.db = db

client.commands = new Collection()
client.events = new Collection()
client.buttons = new Collection()
client.selects = new Collection()
client.modals = new Collection()

require('./handlers/commands')(client)
require('./data/database')
require('./handlers/events')(client)
require('./handlers/interactions')(client)
require('./handlers/slashcommands')(client)

client.login(config.token)