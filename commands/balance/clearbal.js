const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { clearBalance } = require('../../utils/balance.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearbal')
        .setDescription("Clears a user's balance")
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to clear balance for')
                .setRequired(true)
        ),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const result = await clearBalance(user.id);
        await interaction.reply(`Cleared balance for ${user.username}. \nNew Balance: $${result.balance_usd} USD, ${result.balance_rbx} RBX`);
    }
}