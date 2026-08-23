const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const { showQueue } = require("../../utils/queue");
const { ButtonBuilder } = require("discord.js");

module.exports = {
  // TODO: clean description
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Show the current gfs queue")
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ),
  async execute(interaction) {
    let currentPage = 0;
    let { content, maxPage } = await showQueue([], currentPage);
    const leftButton = new ButtonBuilder()
      .setCustomId("left")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("⬅️")
      .setDisabled(true);
    const firstPageButton = new ButtonBuilder()
      .setCustomId("fpage")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("⏪")
      .setDisabled(true);

    const rightButton = new ButtonBuilder()
      .setCustomId("right")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("➡️");

    const lastPageButton = new ButtonBuilder()
      .setCustomId("lpage")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("⏩");

    if (currentPage + 1 >= maxPage) {
      rightButton.setDisabled(true);
    }

    const response = await interaction.reply({
      content: content,
      components: [
        new ActionRowBuilder().setComponents(
          firstPageButton,
          leftButton,
          rightButton,
          lastPageButton,
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });

    const filter = (i) => i.user.id === interaction.user.id;

    const collector = response.createMessageComponentCollector({
      filter,
      time: 60_000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();
      rightButton.setDisabled(false);
      leftButton.setDisabled(false);
      firstPageButton.setDisabled(false);
      lastPageButton.setDisabled(false);

      switch (i.customId) {
        case "left":
          currentPage -= 1;
          break;
        case "right":
          currentPage += 1;
          break;
        case "fpage":
          currentPage = 0;
          break;
        case "lpage":
          currentPage = maxPage - 1;
      }
      if (currentPage - 1 < 0) {
        leftButton.setDisabled(true);
        firstPageButton.setDisabled(true);
      }
      if (currentPage + 1 >= maxPage) {
        rightButton.setDisabled(true);
        lastPageButton.setDisabled(true);
      }
      ({ content, maxPage } = await showQueue([], currentPage));

      await i.editReply({
        content: content,
        components: [
          new ActionRowBuilder().setComponents(
            firstPageButton,
            leftButton,
            rightButton,
            lastPageButton,
          ),
        ],
      });
    });
  },
};
