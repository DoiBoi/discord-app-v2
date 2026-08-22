const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require("discord.js");
const { appendLog } = require("../../utils/log");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addlog")
    .setDescription("Add's entry to the log")
    .addNumberOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount to add to log")
        .setRequired(true),
    )
    .setContexts(
      InteractionContextType.BotDM,
      InteractionContextType.Guild,
      InteractionContextType.PrivateChannel,
    ),
  async execute(interaction) {
    const amount = interaction.options.getNumber("amount");
    const data = await appendLog(amount);
    await interaction.reply({
      content: `Successfully added \`${data.amount}\` at \`${new Date(data.date).toLocaleString()}\` to log`,
      flags: MessageFlags.Ephemeral
    });
  },
};
