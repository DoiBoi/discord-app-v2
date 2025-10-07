const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { setGfs } = require("../../utils/gfs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remgfs')
        .setDescription('Removes a user to the GFS list')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to be removed from the list')
                .setRequired(true)
        )
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const user = interaction.options.getUser('user')
        try {
            const data = await setGfs(user.id, false);
            await interaction.reply({ content: `Successfully removed ${user.username} from the GFS List`, ephemeral: true})
        } catch {
            await interaction.reply({ content: 'An error occured running this command', ephemeral: true})
        }
    } 
}