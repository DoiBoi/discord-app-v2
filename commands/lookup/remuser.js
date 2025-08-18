const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { removeAccount } = require("../../utils/username.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remuser')
        .setDescription('Remove a user account')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove an account for')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('account')
                .setDescription('The account to remove')
                .setRequired(true))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const account = interaction.options.getString('account');
        const updatedAccounts = await removeAccount(user.id, account);
        return interaction.reply({ content: `Removed account for ${user.username}: \n\`${updatedAccounts.join('\` / \`')}\``, ephemeral: true });
    }
}
