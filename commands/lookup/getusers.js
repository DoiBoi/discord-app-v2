const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { getAccounts } = require("../../utils/username.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('users')
        .setDescription('Get user accounts')
        .addStringOption(option =>
            option.setName('user')
                .setDescription('The user to get accounts for')
                .setRequired(true)
                .addChoices(
                    { name: "felanov", value: "felanov" },
                    { name: "haohao", value: "haohao" },
                    { name: "knuckles", value: "knuckles"},
                    { name: "malowie", value: "malowie"},
                    { name: "shehab", value: "shehab"}
                ))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const user = interaction.options.getString('user');
        const accounts = await getAccounts(user);
        console.log(accounts);
        if (!accounts) {
            return interaction.reply({ content: 'No accounts found.', ephemeral: true });
        }
        return interaction.reply({ content: `Accounts for ${user}: \n\`${accounts.join('\` / \`')}\``, ephemeral: true });
    }
}
