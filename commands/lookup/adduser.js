const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { appendAccount } = require("../../utils/username.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adduser')
        .setDescription('Add a user account')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to add an account for')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('account')
                .setDescription('The account to add')
                .setRequired(true))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const account = interaction.options.getString('account');
        const updatedAccounts = await appendAccount(user.id, account);
        return interaction.reply({ content: `Added account for ${user.username}: \n\`${updatedAccounts.join('\` / \`')}\``, ephemeral: true });
    }
}
