const {
  SlashCommandBuilder,
  MessageFlags,
  InteractionContextType,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const { getItems, editItems } = require("../../utils/ugc");
const { ButtonBuilder } = require("discord.js");
const { updateUGCBoards } = require("../../utils/build");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("editugc")
    .setDescription("Edits entry on queue")
    .addNumberOption((option) =>
      option
        .setName("position")
        .setDescription("the position of the entry to be edited")
        .setRequired(true),
    )
    .addNumberOption((option) =>
      option.setName("amount").setDescription("the amount to change to"),
    )
    .addNumberOption((option) =>
      option.setName("rate").setDescription("the new rate to update to"),
    )
    .addStringOption((option) =>
      option.setName("user").setDescription("the new user to update to"),
    )
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ),
  async execute(interaction) {
    const username = interaction.options.getString("user");
    const position = interaction.options.getNumber("position");
    const rate = interaction.options.getNumber("rate");
    const amount = interaction.options.getNumber("amount");

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });
    const entries = await getItems();
    if (position > entries.length) {
      return interaction.editReply({
        content: "Position specified is out of bounds!",
      });
    }
    const entry = entries[position - 1];
    const response = await interaction.editReply({
      content: `Is this the correct entry to edit?\nUsername: \`${entry.username}\`\nAmount: \`${entry.amount}\`\nRate: \`${entry.rate}\``,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("ugc-edit-y")
            .setLabel("Yes")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("ugc-edit-n")
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
      if (i.customId == "ugc-edit-n") {
        await i.reply({
          content:
            "Please specific the correct by position by checking the listings",
          flags: MessageFlags.Ephemeral,
        });
      }
      if (i.customId == "ugc-edit-y") {
        await i.deferReply({
          flags: MessageFlags.Ephemeral,
        });
        const payload = {
          id: entry.id,
        };
        if (username) {
          payload.username = username;
        }
        if (rate) {
          payload.rate = rate;
        }
        if (amount) {
          payload.amount = amount;
        }
        const data = await editItems(payload);
        await i.editReply({
          content: `Updated entry\nUsername: \`${data.username}\`\nAmount: \`${data.amount}\`\nRate: \`${data.rate}\``,
        });
        await updateUGCBoards(i)
      }
    });
  },
};
