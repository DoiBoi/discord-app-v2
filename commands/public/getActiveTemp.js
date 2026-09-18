const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
} = require("discord.js");
const {
  getAvailableTransaction,
  getExchanges,
} = require("../../utils/temp_exchage");
const { ids } = require("../../utils/config");

const MESSAGES_TABLE = ids.message_link;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("getactivetemp")
    .setDescription("Shows channels with active temp entries")
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ),
  async execute(interaction) {
    const exchanges = Object.values(await getExchanges())
      .flat()
      .filter((item) => item[MESSAGES_TABLE].length > 0 || item.pending > 0);
    if (exchanges.length <= 0) {
      return await interaction.reply({
        content: "There are no active transactions!",
        flags: MessageFlags.Ephemeral,
      });
    }
    const message = exchanges.reduce((acc, exchange) => {
      acc += `<#${exchange.channel}> \`${exchange.info}\`: \$${exchange.pending > 0 ? `${exchange.amount}-${exchange.pending}=${(exchange.amount - exchange.pending).toFixed(2)}` : exchange.amount.toFixed(2)}${exchange[
        MESSAGES_TABLE
      ].reduce((acc, message, idx, arr) => {
        if (idx === arr.length - 1) {
          acc += `${message.url}`;
        } else {
          acc += `${message.url}, `;
        }
        return acc;
      }, " ")}\n`;
      return acc;
    }, "Here the the current active exchanges:\n");
    await interaction.reply({
      content: message,
      flags: MessageFlags.Ephemeral,
    });
  },
};
