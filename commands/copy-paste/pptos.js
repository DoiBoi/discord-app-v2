const { SlashCommandBuilder,
    InteractionContextType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonStyle,
    ButtonBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pptos')
        .setDescription('Sends a paypal TOS default message')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        await interaction.reply({ content: "__SCREEN RECORD THE SENDING & THE RECEIPT PAGE ON THE MOBILE APP__\nMake sure your payments are** FNF, BALANCE AND USD**\n> If you send bank, card, gns payments and/or you don’t screen record from mobile app, I will not release the crypto.\n$200 to https://www.paypal.me/malieno\n> Change their currency to USD before you send, **they must receive USD**", flags: MessageFlags.Ephemeral });
    }
}