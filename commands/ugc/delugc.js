const {
  SlashCommandBuilder,
  MessageFlags,
  InteractionContextType,
  ButtonStyle,
  ChannelType,
} = require("discord.js");
const { getItems, removeItems } = require("../../utils/ugc");
const { ActionRowBuilder } = require("discord.js");
const { updateUGCBoards } = require("../../utils/build");
const { ButtonBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("delugc")
    .setDescription("Deletes entry on queue")
    .addNumberOption((option) =>
      option.setName("position").setDescription("The position on the board"),
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel of the entries")
        .addChannelTypes(ChannelType.GuildText),
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
    const channel = interaction.options.getChannel("channel");
    const position = interaction.options.getNumber("position");
    if ((channel && position) || (!channel && !position)) {
      return await interaction.editReply({
        content: "Please supply only one of the two",
        flags: MessageFlags.Ephemeral,
      });
    }
    const entries = await getItems();
    let entry;
    const params = {};
    if (position) {
      if (position >= entries.length) {
        return await interaction.editReply({
          content: "Position out of bounds!",
        });
      }
      entry = entries[position - 1];
      params.id = entry.id;
    } else if (channel) {
      params.channel = channel.id;
      entry = entries.filter((item) => item.channel_id == channel.id);
    }
    const response = await interaction.editReply({
      content: `Are you sure you want to delete the following?\n${params.id ? `\`${entry.username}\`: ${entry.amount} (${entry.rate})` : ""}${
        params.channel
          ? entry
              .map((item) => {
                return `\`${item.username}\`: ${item.amount} (${item.rate})`;
              })
              .join("\n")
          : ""
      }`,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("ugc-del-y")
            .setLabel("Yes")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("ugc-del-n")
            .setLabel("No")
            .setStyle(ButtonStyle.Danger),
        ),
      ],
    });

    const filter = (i) => i.user.id == interaction.user.id;

    const collector = response.createMessageComponentCollector({
      filter,
      time: 60_000,
    });

    collector.on("collect", async (i) => {
      if (i.customId == "ugc-del-n") {
        await i.reply({
          content:
            "Please specific the correct by position by checking the listings",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (i.customId == "ugc-del-y") {
        await i.deferReply({
          flags: MessageFlags.Ephemeral,
        });
        const data = await removeItems(params);

        await i.editReply({
          content: `Successfully deleted ${data.length} item(s)`,
        });
        await updateUGCBoards(i);
      }
    });
  },
};
