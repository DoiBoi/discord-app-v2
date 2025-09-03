const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { setOwe } = require("../../utils/owe");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remowe')
        .setDescription('Removes a user to the OWE list')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to be removed from the list')
                .setRequired(true)
        )
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const user = interaction.options.getUser('user')
        try {
            const data = await setOwe(user.id, false);
            await interaction.reply({ content: `Successfully removed ${user.username} from the OWE List`})
        } catch {
            await interaction.reply({ content: 'An error occured running this command', ephermeral: true})
        }
    } 
}