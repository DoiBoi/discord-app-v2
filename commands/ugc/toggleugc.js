const {
  SlashCommandBuilder,
  MessageFlags,
  InteractionContextType,
} = require("discord.js");
const { getItems, toggleLogged } = require("../../utils/ugc");
const { updateUGCBoards } = require("../../utils/build");


module.exports = {
  data: new SlashCommandBuilder()
    .setName("toggleugc")
    .setDescription("Toggle whether an entry is logged")
    .addStringOption((option) =>
      option
        .setName("positions")
        .setDescription("The positions to edit separate using a space")
        .setRequired(true),
    )
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ),
  async execute(interaction) {
    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });
    const entries = (await getItems()).map((item) => item.id);
    const positions = interaction.options
      .getString("positions")
      .split(" ")
      .map((item) => entries[Number(item) - 1] ?? null)
      .filter((ids) => ids)

    const data = await toggleLogged(positions);
    await interaction.editReply({
      content: `Toggled ${data.length} entr${data.length == 1 ? "y": "ies"}`,
    });
    await updateUGCBoards(interaction);
  },
};
