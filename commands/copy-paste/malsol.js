const { SlashCommandBuilder,
    InteractionContextType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonStyle,
    ButtonBuilder,
    MessageFlags
} = require('discord.js');
const { getWallet } = require("../../utils/crypto")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('malsol')
        .setDescription('Gets the address of Solana coin account')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const wallet = await getWallet('sol')
        if (!wallet) {
            await interaction.reply({ content: 'Wallet not found', flags: MessageFlags.Ephemeral });
            return;
        }
        await interaction.reply({ content: wallet.wallet });
    }
}