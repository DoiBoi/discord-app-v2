const {
  SlashCommandBuilder,
  MessageFlags,
  InteractionContextType,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("payugc")
    .setDescription("Pays out entries to queue")
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ),
  async execute(interaction) {
    await interaction.reply({
      content: "In development",
      flags: MessageFlags.Ephemeral,
    });
  },
};
