const {
    SlashCommandBuilder,
    InteractionContextType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonStyle,
    ButtonBuilder
} = require('discord.js');
const { toggleInUse } = require("../../utils/gamepass");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggleinuse')
        .setDescription('Sets the pass\'s in use from true to false and vice versa')
        .addStringOption(option =>
            option.setName("pass")
                .setDescription('Name of the pass to toggle on')
                .setRequired(true)
                .addChoices(
                    { name: "APPREC", value: "APPREC" },
                    { name: "BEST", value: "BEST" },
                    { name: "DONATION", value: "DONATION" },
                    { name: "LARGE", value: "LARGE" },
                    { name: "SMALL", value: "TYCOMM" },
                    { name: "UGC", value: "UGC" },
                )
        )
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const pass = interaction.options.getString('pass');
        const passDetails = await toggleInUse(pass);
        if (!passDetails) {
            return interaction.reply({ content: 'No pass found.', ephemeral: true });
        }
        return interaction.reply({ content: `${passDetails.name}'s \`in_use\` field has been updated to \`${passDetails.in_use}\``, ephemeral: true })
    }
}