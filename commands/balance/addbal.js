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
        .addStringOption(option =>
            option.setName('amount')
                .setDescription('The amount to add to the balance, separated by spaces for multiple values')
                .setRequired(true)
        ),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const currency = interaction.options.getString('currency');
        const amount = interaction.options.getString('amount');

        let result = null;

        switch (currency) {
            case 'rbx':
                [result, oldBalanceRbx, oldBalanceUsd] = await editBalance(user.id, amount.split(" ").map(num => parseInt(num.replace(",", ''))), []);
                await interaction.reply(`-# :green_circle: Added $${amount.split(" ").map(num => parseInt(num.replace(",", ''))).reduce((a, b) => a + b, 0)} RBX to ${user.username}'s balance ||(**Previous balance: ${oldBalanceRbx} RBX**)|| \n**New Balance:** $${result.balance_usd} USD, ${result.balance_rbx} RBX`);
                break;
            case 'usd':
                [result, oldBalanceRbx, oldBalanceUsd] = await editBalance(user.id, [], amount.split(" ").map(num => parseFloat(num.replace(",", ''))));
                await interaction.reply(`-# :green_circle: Added $${amount.split(" ").map(num => parseFloat(num.replace(",", ''))).reduce((a, b) => a + b, 0)} USD to ${user.username}'s balance ||(**Previous balance: ${oldBalanceUsd} USD**)|| \n**New Balance:** $${result.balance_usd} USD, ${result.balance_rbx} RBX`);
                break;
        }
    }
};
