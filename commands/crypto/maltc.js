const { SlashCommandBuilder,
    InteractionContextType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonStyle,
    ButtonBuilder
} = require('discord.js');
const { getWallet } = require("../../utils/crypto")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('maltc')
        .setDescription('Gets the address of litecoin account')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const wallet = await getWallet('ltc')
        if (!wallet) {
            await interaction.reply({ content: 'Wallet not found', ephemeral: true });
            return;
        }
        await interaction.reply({ content: wallet.wallet });
    }
}