const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { editBalance } = require('../../utils/balance.js');
const { execute } = require('./getbal.js');

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
                    const parsedInt = parseInt(num_str);
                    amount_arr.push(-parsedInt);
                }
                result = await editBalance(user.id, amount_arr, []);
                await interaction.reply(`:red_circle: Subtracted $${amount.split(" ").map(num => parseInt(num)).reduce((a, b) => a + b, 0)} RBX from ${user.username}, \nNew Balance: $${result.balance_usd} USD, ${result.balance_rbx} RBX`);
                break;
            case 'usd':
                for (const num_str of amount.split(' ')) {
                    const parsedFloat = parseFloat(num_str);
                    if (isNaN(parsedFloat)) {
                        return interaction.reply('Invalid amount provided. Please provide a valid number.');
                    }
                    amount_arr.push(-parsedFloat);
                }
                result = await editBalance(user.id, [], amount_arr);
                await interaction.reply(`:red_circle: Subtracted $${amount.split(" ").map(num => parseFloat(num)).reduce((a, b) => a + b, 0)} USD from ${user.username}, \nNew Balance: $${result.balance_usd} USD, ${result.balance_rbx} RBX`);
                break;
        }
    }
}