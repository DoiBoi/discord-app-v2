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
        .addNumberOption(option => 
            option.setName('amount')
                .setDescription('The amount to pay from the balance')
                .setRequired(true)
        ),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const currency = interaction.options.getString('currency');
        const amount = interaction.options.getNumber('amount');

        let result = null;
        switch (currency) {
            case 'rbx':
                result = await editBalance(user.id, -amount, 0);
                await interaction.reply(`Paid $${amount} RBX to ${user.username}, \nNew Balance: $${result.balance_usd} USD, $${result.balance_rbx} RBX`);
                break;
            case 'usd':
                result = await editBalance(user.id, 0, -amount);
                await interaction.reply(`Paid $${amount} USD to ${user.username}, \nNew Balance: $${result.balance_usd} USD, $${result.balance_rbx} RBX`);
                break;
        }
    }
}