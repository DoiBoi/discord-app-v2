const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { setPay } = require("../../utils/pay.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addpay')
        .setDescription('Adds info to user')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to add info to')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('info')
                .setDescription('The info to add to user')
                .setRequired(true)
        )
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const info = interaction.options.getString('info');
        try {
            const data = await setPay(user.id, info)
            await interaction.reply({ content: `Successfully added ${info} to ${user.username}`, ephemeral: true });
        } catch (error) {
            await interaction.reply({ content: "An error occured!" + error.message, ephemeral: true});
        }
    }
}