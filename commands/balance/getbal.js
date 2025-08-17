const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { getUserBalance } = require('../../utils/balance.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getbal')
        .setDescription("Gets your user's balance")
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get the balance of')
                .setRequired(true)
        ),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const balance = await getUserBalance(user.id);
        await interaction.reply(`User ${user.username} has a balance of $${balance.balance_usd} USD and $${balance.balance_rbx} RBX.`);
    }
};
