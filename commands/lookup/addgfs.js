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
        .addStringOption(option =>
            option.setName("info")
            .setDescription("The info to add to the user")
        )
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const user = interaction.options.getUser('user')
        const info = interaction.options.getString('info')
        try {
            const data = await setGfs(user.id, true, info);
            await interaction.reply({ content: `Successfully added ${user.username} into the GFS List ${info ? `and added \`${info}\` to their info`: ''}`, ephemeral: true})
        } catch {
            await interaction.reply({ content: 'An error occured running this command', ephemeral: true})
        }
    } 
}