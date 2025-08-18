const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { getAccounts } = require("../../utils/username.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('users')
        .setDescription('Get user accounts')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get accounts for')
                .setRequired(true))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const accounts = await getAccounts(user.id);
        if (!accounts) {
            return interaction.reply({ content: 'No accounts found.', ephemeral: true });
        }
        return interaction.reply({ content: `Accounts for ${user.username}: \n\`${accounts.join('\` / \`')}\``, ephemeral: true });
    }
}
