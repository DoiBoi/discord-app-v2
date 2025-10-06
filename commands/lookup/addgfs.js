const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { setGfs } = require("../../utils/gfs")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addgfs')
        .setDescription('Adds a user to the GFS list')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to be added to the list')
                .setRequired(true)
        )
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const user = interaction.options.getUser('user')
        try {
            const data = await setGfs(user.id, true);
            await interaction.reply({ content: `Successfully added ${user.username} into the GFS List`, ephermeral: true})
        } catch {
            await interaction.reply({ content: 'An error occured running this command', ephermeral: true})
        }
    } 
}