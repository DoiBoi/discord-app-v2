const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { editBalance } = require('../../utils/balance.js');
const { appendUserHistory } = require('../../utils/history.js');

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
        let amount_arr = [];

        try {
            switch (currency) {
                case 'rbx':
                    amount_arr = amount.split(" ").map(num => parseInt(num.replace(",", '')));
                    [result, oldBalanceRbx, oldBalanceUsd] = await editBalance(user.id, amount_arr, []);
                    await appendUserHistory(user.id, 'rbx', amount_arr)
                    await interaction.reply({
                        content: `**New Balance:** $${result.balance_usd} USD, ${result.balance_rbx} RBX\n-# :green_circle: Added $${amount.split(" ").map(num => parseInt(num.replace(",", ''))).reduce((a, b) => a + b, 0)} RBX to ${user.username}'s balance\n||(**Previous balance: ${oldBalanceRbx} RBX**${result.info ? `, **Information:** \`${result.info}\`` : ''})||`
                    });
                    break;
                case 'usd':
                    amount_arr = amount.split(" ").map(num => parseFloat(num.replace(",", '')));
                    [result, oldBalanceRbx, oldBalanceUsd] = await editBalance(user.id, [], amount_arr);
                    await appendUserHistory(user.id, 'usd', amount_arr)
                    await interaction.reply({
                        content: `**New Balance:** $${result.balance_usd} USD, ${result.balance_rbx} RBX\n-# :green_circle: Added $${amount.split(" ").map(num => parseFloat(num.replace(",", ''))).reduce((a, b) => a + b, 0)} USD to ${user.username}'s balance\n||(**Previous balance: ${oldBalanceUsd} USD**${result.info ? `, **Information:** \`${result.info}\`` : ''})||`
                    });
                    break;
            }
        } catch (error) {
            console.log(error.message);
            await interaction.reply({
                content: "An error occured!",
                ephemeral: true
            })
        }
    }
};
