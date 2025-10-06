const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { setOwe } = require("../../utils/owe");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addowe')
        .setDescription('Adds a user to the OWE list')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to be added to the list')
                .setRequired(true)
        )
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const user = interaction.options.getUser('user')
        try {
            const data = await setOwe(user.id, true);
            await interaction.reply({ content: `Successfully added ${user.username} into the OWE List`, ephemeral: true })
        } catch {
            await interaction.reply({ content: 'An error occured running this command', ephemeral: true})
        }
    } 
}