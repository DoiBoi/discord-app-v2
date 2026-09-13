const {
  SlashCommandBuilder,
  MessageFlags,
  InteractionContextType,
  TextDisplayBuilder,
  ModalBuilder,
  LabelBuilder,
  TextInputStyle,
} = require("discord.js");
const { fetchGroups } = require("../../utils/ugc");
const { TextInputBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stockugc")
    .setDescription("Updates the stock on groups")
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ),
  async execute(interaction) {
    const groups = await fetchGroups();
    const modal = new ModalBuilder()
      .setCustomId("stock-groups")
      .setTitle("Stock Groups")
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          groups.reduce(
            (acc, curr) =>
              (acc += `${curr.id} (\`${curr.order}\`): ${curr.amount}\n`),
            "# Groups\n",
          ),
        ),
      )
      .addLabelComponents(
        new LabelBuilder()
          .setLabel("Insert entries:")
          .setDescription(
            "Separate entries by new lines and format the entries by [group]/[amount]",
          )
          .setTextInputComponent(
            new TextInputBuilder()
              .setCustomId("entries-input")
              .setStyle(TextInputStyle.Paragraph),
          ),
      );
    await interaction.showModal(modal);
  },
};
