const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { editBalance } = require('../../utils/balance.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addbal')
        .setDescription("Adds to a user's balance")
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to add balance to')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('currency')
                .setDescription('The currency to add (rbx or usd)')
                .setRequired(true)
                .addChoices(
                    { name: 'RBX', value: 'rbx' },
                    { name: 'USD', value: 'usd' }
                )
        )
        .addNumberOption(option =>
            option.setName('amount')
                .setDescription('The amount to add to the balance')
                .setRequired(true)
        ),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const currency = interaction.options.getString('currency');
        const amount = interaction.options.getNumber('amount');

        let result = null
        switch (currency) {
            case 'rbx':
                result = await editBalance(user.id, amount, 0);
                await interaction.reply(`Added $${amount} RBX to ${user.username}'s balance. \nNew Balance: $${result.balance_usd} USD, ${result.balance_rbx} RBX`);
                break;
            case 'usd':
                result = await editBalance(user.id, 0, amount);
                await interaction.reply(`Added $${amount} USD to ${user.username}'s balance. \nNew Balance: $${result.balance_usd} USD, ${result.balance_rbx} RBX`);
                break;
        }
    }
};
