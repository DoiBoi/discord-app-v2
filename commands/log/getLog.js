const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
  ButtonStyle,
} = require("discord.js");
const { getLog, getWeekReport } = require("../../utils/log");
const { ButtonBuilder } = require("discord.js");
const { ActionRowBuilder } = require("discord.js");

function formatLog(log, weekBool = false) {
  if (weekBool) {
    return (
      "```" +
      log.reduce(
        (acc, curr) =>
          acc + `${new Date(curr.date).toDateString()}: ${curr.amount}\n`,
        "",
      ) +
      `Total for this week: ${log.reduce((acc, curr) => acc + curr.amount, 0)}` +
      "```"
    );
  }
  return log.reduce(
    (acc, curr, index) =>
      acc +
      `${index + 1}. ${curr.amount} at ${new Date(curr.date).toLocaleString()}\n`,
    "",
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("getprofit")
    .setDescription("Gets log of profit")
    .addStringOption((option) =>
      option
        .setName("date")
        .setDescription(
          "Finds log for a specific date (Format option DD/MM/YYYY)",
        ),
    )
    .addBooleanOption((option) =>
      option
        .setName("week")
        .setDescription("Toggle to show week-by-week summary"),
    )
    .setContexts(
      InteractionContextType.BotDM,
      InteractionContextType.Guild,
      InteractionContextType.PrivateChannel,
    ),
  async execute(interaction) {
    let index = 0;
    const date = interaction.options.getString("date");
    const weekBoolean = interaction.options.getBoolean("week");

    if (date) {
      const [day, month, year] = date.split("/").map(Number);

      const dateObject = new Date(year, month - 1, day);
    }

    let rightButton, leftButton;
    const params = {};
    if (weekBoolean) {
      params.week = index;
    } else {
      params.index = index;
    }
    if (date) {
      params.date = date
    }
    let { data, count } = {};

    if (weekBoolean) {
      ({ data, count } = await getWeekReport(index));
    } else {
      ({ data, count } = await getLog(params));
    }

    leftButton = new ButtonBuilder()
      .setCustomId("left")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("⬅️")
      .setDisabled(true);

    rightButton = new ButtonBuilder()
      .setCustomId("right")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("➡️");

    if (index + 1 > count) {
      rightButton.setDisabled(true);
    }

    const response = await interaction.reply({
      content: formatLog(data, weekBoolean),
      flags: MessageFlags.Ephemeral,
      components: [
        new ActionRowBuilder().setComponents(leftButton, rightButton),
      ],
    });

    filter = (i) => i.user.id === interaction.user.id;

    const collector = response.createMessageComponentCollector({
      filter,
      time: 60_000,
    });

    collector.on("collect", async (i) => {
      if (i.customId.includes("left")) {
        index -= 1;
        if (index - 1 < 0) {
          leftButton.setDisabled(true);
        }
      } else if (i.customId.includes("right")) {
        index += 1;
        if (index + 1 > count) {
          rightButton.setDisabled(true);
        }
      }

      if (weekBoolean) {
        ({ data, count } = await getWeekReport(index));
      } else {
        ({ data, count } = await getLog(params));
      }

      await i.update({
        content: formatLog(data, weekBoolean),
        flags: MessageFlags.Ephemeral,
        components: [
          new ActionRowBuilder().setComponents(leftButton, rightButton),
        ],
      });
      console.log(index);
    });
  },
};
