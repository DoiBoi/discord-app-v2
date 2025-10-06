const { SlashCommandBuilder,
    InteractionContextType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonStyle,
    ButtonBuilder
} = require('discord.js');
const { listGamePasses } = require("../../utils/gamepass");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listpass')
        .setDescription('get all of the passes\' details')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const pass = interaction.options.getString('pass');
        const passDetails = await listGamePasses();
        if (!passDetails) {
            return interaction.reply({ content: 'No pass found.', ephemeral: true });
        }
        let passes = ""
        passDetails.forEach(passItem => {
            passes += `${passItem.name}: ${passItem.in_use ? ":red_circle: in use" : ":green_circle: not in use"}\nlink: ${passItem.link} \n`
        });
        return interaction.reply({ content: "Here are the passes: \n" + passes, ephemeral: true })
    }
}
