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
        .setName('mmusdt')
        .setDescription('Gets the prompt for usdt account')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const wallet = await getWallet('mmusdt')
        if (!wallet) {
            await interaction.reply({ content: 'Wallet not found', flags: MessageFlags.Ephemeral });
            return;
        }
        await interaction.reply({ content: `\`${wallet.wallet}\`\n-# USDT on BNB smart chain (BEP-20)\n\n__Send extra **$0.1 BNB** or **$0.15 USDT** for the sending fee__` });
    }
}