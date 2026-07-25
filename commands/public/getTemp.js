const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
} = require("discord.js");
const { getAvailableTransaction } = require("../../utils/temp_exchage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gettemp")
    .setDescription("Shows channels with pending")
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ),
  async execute(interaction) {
    const exchanges = await getAvailableTransaction();
    if (exchanges.length <= 0) {
      return await interaction.reply({
        content: "There are no active transactions!",
        flags: MessageFlags.Ephemeral,
      });
    }
    const message = exchanges.reduce((acc, exchange) => {
      acc += `\`${exchange.info}\`: \$${exchange.pending} ${exchange.message_links.reduce(
        (acc, message, idx, arr) => {
          if (idx === arr.length - 1) {
            acc += `${message.url}`;
          } else {
            acc += `${message.url}, `;
          }
          return acc;
        },
        " ",
      )}\n`;
      return acc;
    }, "Here the the current active temps:\n");
    await interaction.reply({
      content: message,
      flags: MessageFlags.Ephemeral,
    });
  },
};
