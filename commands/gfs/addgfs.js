const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { DateTime } = require("luxon");
const { addUserGFS } = require("../../utils/preorder")

const REGEX_FILTER = /\d+|AM|PM/gm 

function handleDateTime(timestamp) {
    const zone = "America/Los_Angeles";
    const now = DateTime.now().setZone(zone);
    const year = DateTime.now().setZone(zone).year;

    const dt = DateTime.fromFormat(
        `${timestamp} ${year}`,
        `d/M - h:mm a yyyy`,
        { zone }
    )

    if (!dt.isValid) {
         throw new Error(`Invalid timestamp format: ${dt.invalidReason}`);
    }

    if (dt > now) {
        dt = dt.minus({ years: 1 });
    }

    return dt.toUTC().toISO();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addgfs')
        .setDescription('Adds a user to the GFS list')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to be added to the list')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("info")
                .setDescription("The info to add to the user")
                .setRequired(true)
        )
        .addNumberOption(option =>
            option.setName("amount")
                .setDescription("The balance the user has")
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName("timestamp")
                .setDescription("Order time (PT). Format: DD/MM - HH:MM AM/PM")
        )
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const user = interaction.options.getUser('user')
        const info = interaction.options.getString('info')
        const amount = interaction.options.getNumber('amount')
        const timestamp = interaction.options.getString('timestamp')
        try {
            const data = await addUserGFS(user.id, info, amount, handleDateTime(timestamp));
            await interaction.reply({ content: `Successfully added ${user.username} into the GFS List ${info ? `and added \`${info}\` to their info`: ''}`, flags: MessageFlags.Ephemeral})
        } catch (error) {
            await interaction.reply({ content: 'An error occured running this command', flags: MessageFlags.Ephemeral})
            console.log(error.message)
        }
    } 
}