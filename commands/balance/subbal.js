const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { editBalance } = require('../../utils/balance.js');
const { appendUserHistory } = require('../../utils/history.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('subbal')
        .setDescription("Pays (subtracts) a user's balance")
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to pay balance from')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('currency')
                .setDescription('The currency to pay (rbx or usd)')
                .setRequired(true)
                .addChoices(
                    { name: 'RBX', value: 'rbx' },
                    { name: 'USD', value: 'usd' }
                )
        )
        .addStringOption(option =>
            option.setName('amount')
                .setDescription('The amount to subtract from the balance, separated by spaces for multiple values')
                .setRequired(true)
        ),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const currency = interaction.options.getString('currency');
        const amount = interaction.options.getString('amount');
        let amount_arr = []

        let result = null;
        switch (currency) {
            case 'rbx':
                for (const num_str of amount.split(' ')) {
                    const parsedInt = parseInt(num_str.replace(",", ''));
                    amount_arr.push(-parsedInt);
                }
                [result, oldBalanceRbx, oldBalanceUsd] = await editBalance(user.id, amount_arr, []);
                await appendUserHistory(user.id, 'rbx', amount_arr);
                await interaction.reply(`**New Balance:** $${result.balance_usd} USD, ${result.balance_rbx} RBX\n-# :red_circle: Subtracted $${amount.split(" ").map(num => parseInt(num.replace(",", ''))).reduce((a, b) => a + b, 0)} RBX from ${user.username}'s balance\n||(**Previous balance: ${oldBalanceRbx} RBX**${result.info ? `, **Information:** \`${result.info}\`` : ''})||`);
                break;
            case 'usd':
                for (const num_str of amount.split(' ')) {
                    const parsedFloat = parseFloat(num_str.replace(",", ''));
                    if (isNaN(parsedFloat)) {
                        return interaction.reply('Invalid amount provided. Please provide a valid number.');
                    }
                    amount_arr.push(-parsedFloat);
                }
                [result, oldBalanceRbx, oldBalanceUsd] = await editBalance(user.id, [], amount_arr);
                await appendUserHistory(user.id, 'usd', amount_arr)
                await interaction.reply(`**New Balance:** $${result.balance_usd} USD, ${result.balance_rbx} RBX\n-# :red_circle: Subtracted $${amount.split(" ").map(num => parseFloat(num.replace(",", ''))).reduce((a, b) => a + b, 0)} USD from ${user.username}'s balance\n||(**Previous balance: ${oldBalanceUsd} USD**${result.info ? `, **Information:** \`${result.info}\`` : ''})||`);
                break;
        }
    }
}