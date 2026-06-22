require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const adminCommands = require('./commands.json')
const { auth } = require('./utils/supabase/supabase_client.js')
const { getExchange, addToPending } = require('./utils/temp_exchage.js')
const { buildTempModal, buildChannelDropdown } = require('./utils/build.js')
const { Client,
    Collection,
    Events,
    GatewayIntentBits,
    MessageFlags,
    ActivityType,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const {buildDropdown, buildMessage, buildResponse} = require('./commands/public/tempTrigger')

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
    try {
        if (interaction.isStringSelectMenu()) {
            switch (interaction.customId) {
                case "dropdown":
                    const item = await getExchange(interaction.values[0])
                    const modal = buildTempModal(interaction.values[0], item)
                    await interaction.showModal(modal);

                    const oldComponent = interaction.component;

                    const clearedMenu = new StringSelectMenuBuilder()
                        .setCustomId(oldComponent.customId)
                        .setPlaceholder(oldComponent.placeholder)
                        .addOptions(oldComponent.options.map(opt => ({
                            label: opt.label,
                            value: opt.value,
                            emoji: opt.emoji || undefined
                        })));

                    const row = new ActionRowBuilder().addComponents(clearedMenu);

                    await interaction.message.edit({
                        components: [row]
                    });
                    break;
                case 'select-channel':
                    break;
                default:
                    await interaction.deferReply()
            }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId.includes("temp-popup")) {
                const item = await getExchange(interaction.customId.match(/\d+/gm)[0])
                const input = parseFloat(interaction.fields.getTextInputValue('temp-input'))

                if (isNaN(input)) {
                    return await interaction.reply({
                        content: "Please input a valid number!",
                        flags: MessageFlags.Ephemeral
                    })
                }

                const amount = item["amount"] - item["pending"]
                if ((amount > item["min"] && (input < item["min"] ||
                    input > amount)) ||
                    (amount <= item["min"] && input != amount)) {
                    return await interaction.reply({
                        content: "Please input a valid number (Please make sure that the amount you input is between the minimum & maximum that the exchange can do)",
                        flags: MessageFlags.Ephemeral
                    })
                }

                const channelResponse = await interaction.reply({
                    content: "Select the channel to do this exchange in\n-# Button will not work after 1 minute",
                    components: [buildChannelDropdown()],
                    flags: MessageFlags.Ephemeral,
                    withResponse: true
                })
                const filter = (i) => i.customId === 'select-channel' && i.user.id === interaction.user.id

                const collector = channelResponse.resource.message.createMessageComponentCollector({
                    filter,
                    time: 60_000
                });

                collector.on('collect', async (i) => {
                    await i.deferUpdate()
                    const targetChannel = i.guild.channels.cache.get(i.values[0])

                    const requiredPerms = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages];

                    if (!targetChannel.permissionsFor(i.user).has(requiredPerms)) {
                        return await i.followUp({
                            content: 'You do not have permission to view or select that channel.',
                            ephemeral: true
                        });
                    }

                    const agreeButton = new ButtonBuilder()
                        .setCustomId('tos-agree')
                        .setLabel('I Agree')
                        .setStyle(ButtonStyle.Success)

                    const cancelButton = new ButtonBuilder()
                        .setCustomId('tos-cancel')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary)

                    const row = new ActionRowBuilder().addComponents(agreeButton, cancelButton)

                    const TOSResponse = await targetChannel.send({
                        // TODO
                        content: '[INSERT MARKDOWN OF TOS]',
                        components: [row]
                    })

                    const filter = (inter) => i.user.id === inter.user.id;
                    const newCollector = TOSResponse.createMessageComponentCollector({ filter, time: 300_000 });

                    newCollector.on("collect", async inter => {
                        const disabledRow = new ActionRowBuilder().addComponents(
                            row.components.map(button => ButtonBuilder.from(button).setDisabled(true))
                        )

                        await inter.update({
                            components: [disabledRow]
                        })


                        if (inter.customId === "tos-agree") {
                            // TODO: wire it so that it updates the temptrigger message with the pending amount subtracted
                            //       create the button row (Complete, cancel, need help) (OPTIONAL: read for screenshot) 
                            //       on complete, ping mal via bot to confirm proof then subtract from balance table on supabase
                            //                    then ask should it be forwarded to the reciever (need to figure this out)
                            //       on cancel, disable all buttons
                            //       on need help, ping mal 
                            await addToPending(item["id"], input)
                            await interaction.channel.send({
                                content: `send ${input} to ${item["info"]}, Send proof \& click complete once done`,
                            })
                        }
                    })

                    newCollector.on('end', async (collected, reason) => {
                        if (reason === 'time') {
                            const timedOutRow = new ActionRowBuilder().addComponents(
                                row.components.map(button => ButtonBuilder.from(button).setDisabled(true))
                            );

                            await TOSResponse.edit({
                                components: [timedOutRow]
                            }).catch(console.error);
                        }
                    })

                    await i.editReply({
                        components: []
                    })
                })

                collector.on('end', async (collected, reason) => {
                    if (reason === "time") {
                        await interaction.editReply({
                            components: []
                        })
                    }
                })

            }
        }

        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            const commandName = interaction.commandName.trim()

            if (adminCommands["AdminCommands"].includes(commandName)) {
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
        }
    } catch (error) {
        console.error(error.message)
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
