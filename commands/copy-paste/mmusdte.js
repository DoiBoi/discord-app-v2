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
        .setName('mmusdte')
        .setDescription('Gets the prompt for usdt account (Ethereum)')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const wallet = await getWallet('mmusdt')
        if (!wallet) {
            await interaction.reply({ content: 'Wallet not found', flags: MessageFlags.Ephemeral });
            return;
        }
        await interaction.reply({ content: `\`${wallet.wallet}\`\n-# USDT on Ethereum network (ETH / ERC-20)\n\n__Send extra **$1 ETH** or **$2 USDT** for the sending fee__` });
    }
}