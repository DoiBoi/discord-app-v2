const { SlashCommandBuilder,
    InteractionContextType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonStyle,
    ButtonBuilder
} = require('discord.js');
const { getGamePass } = require("../../utils/gamepass");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getpass')
        .setDescription('Get specific pass')
        .addStringOption(option =>
            option.setName("pass")
                .setDescription('Name of the pass to get detail of')
                .setRequired(true)
                .addChoices(
                    {name: "APPREC", value: "APPREC"},
                    {name: "BEST", value: "BEST"},
                    {name: "DONATION", value: "DONATION"},
                    {name: "LARGE", value: "LARGE"},
                    {name: "SMALL", value: "TYCOMM"},
                    {name: "UGC", value: "UGC"},
                )
        )
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const pass = interaction.options.getString('pass');
        const passDetails = await getGamePass(pass);
        if (!passDetails) {
            return interaction.reply({ content: 'No pass found.', ephemeral: true });
        }
        return interaction.reply({ content: `${passDetails.link}` })
    }
}
