require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const adminCommands = require('./commands.json')
const { auth } = require('./utils/supabase/supabase_client.js')
const { Client, Collection, Events, GatewayIntentBits, MessageFlags, ActivityType, MessageFlags } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessageReactions
    ]
});

// let adminCommands;

// function loadCommands() {
//     try {
//         const response = await fetch('./commands.json');
//         if (!response.ok) {
//             throw new Error("An error occured");
//         }
//         return response.json();
//     } catch (error) {
//         console.error("An error occured");
//     }
// }

// loadCommands()
//     .then((commands) => {
//         adminCommands = commands["AdminCommands"]
//     }
// )

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`Loaded command: ${command.data.name}`);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

client.once(Events.ClientReady, () => {
    console.log('Bot is online!');

    // Set debug presence if --debug flag is passed
    if (process.argv.includes('--debug')) {
        client.user.setPresence({
            activities: [{
                name: 'Debugging',
                type: ActivityType.Custom,
                state: '🛠️ App in Construction',
            }],
            status: 'dnd'
        });
        client.user.setStatus('dnd');
        console.log('Debug mode enabled - presence set to debugging');
    } else {
        client.user.setPresence({
            activities: [{
                name: 'Watching Mal\'s every action',
                type: ActivityType.Custom,
                state: '👀 Watching Mal\'s every action'
            }],
            status: 'online'
        });
        client.user.setStatus('online');
        console.log('Debug mode disabled - presence set to normal mode');
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    const commandName = interaction.commandName.trim()

    // console.log(adminCommands["AdminCommands"].includes(interaction.commandName.trim()))
    if (adminCommands["AdminCommands"].includes(commandName)) {
        // console.log(interaction.user.id)
        if (await auth(interaction.user.id)) {
            await runInteraction(command, interaction);
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
        }
    } else if (adminCommands["PublicCommands"].includes(commandName)) {
        await runInteraction(command, interaction);
    } else {
        await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
    }


});

client.login(process.env.DISCORD_TOKEN);

async function runInteraction(command, interaction) {
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
    }
}
