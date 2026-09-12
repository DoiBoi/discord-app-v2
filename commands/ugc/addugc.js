const {
  TextInputBuilder,
  TextInputStyle,
  TextDisplayBuilder,
} = require("discord.js");
const { ModalBuilder, LabelBuilder } = require("discord.js");
const { SlashCommandBuilder, InteractionContextType } = require("discord.js");
const { fetchGroups } = require("../../utils/ugc");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addugc")
    .setDescription("Adds entries to UGC queue")
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ),
  async execute(interaction) {
    // await interaction.reply({
    //   content: "In development",
    //   flags: MessageFlags.Ephemeral,
    // });
    const groups = await fetchGroups();
    const modal = new ModalBuilder()
      .setCustomId("add-entry")
      .setTitle("Add Entries")
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          groups.reduce(
            (acc, curr) => (acc += `${curr.id}: \`${curr.order}\`\n`),
            "# Groups\n",
          ),
        ),
      )
      .addLabelComponents(
        new LabelBuilder()
          .setLabel("Insert entries:")
          .setDescription(
            "Separate entries by new lines and format the entries by [user]/[amount]/[group], group is optional ",
          )
          .setTextInputComponent(
            new TextInputBuilder()
              .setCustomId("entries-input")
              .setStyle(TextInputStyle.Paragraph),
          ),
        new LabelBuilder()
          .setLabel("Which rate to apply?")
          .setTextInputComponent(
            new TextInputBuilder()
              .setCustomId("rate-input")
              .setStyle(TextInputStyle.Short),
          ),
      );
    await interaction.showModal(modal);
  },
};
