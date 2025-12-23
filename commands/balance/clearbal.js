const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { clearBalance, getUserInfo } = require('../../utils/balance.js');

const FLAGS = {
    gfs_toggle: false,
    owe_toggle: false,
    info_toggle: true,
    new_line: false
}

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
        console.log(getUserInfo(result.info, FLAGS))
        await interaction.reply(`Cleared balance for ${user.username}. \nNew Balance: $${result.balance_usd} USD, ${result.balance_rbx} RBX. ${getUserInfo(result.info, FLAGS) !== '' ? `\n-# ||${getUserInfo(result.info, FLAGS)}||`: ''}`);
    }
}