const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { setPay } = require("../../utils/pay.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rempay')
        .setDescription('Removes info to user')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to remove info from')
                .setRequired(true)
        )
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        try {
            const data = await setPay(user.id, null)
            await interaction.reply({ content: `Successfully removed info from ${user.username}`, flags: MessageFlags.Ephemeral });
        } catch (error) {
            await interaction.reply({ content: "An error occured! " + error.message, flags: MessageFlags.Ephemeral});
        }
    }
}