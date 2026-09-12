const { MessageFlags, ButtonStyle } = require("discord.js");
const { fetchGroups, addItems } = require("../utils/ugc");
const { ActionRowBuilder } = require("discord.js");
const { ButtonBuilder } = require("discord.js");
const {
  updateUGCPublicBoard,
  updateUGCPrivateBoard,
} = require("../utils/build");

async function handleEntriesAdd(interaction) {
  const groups = (await fetchGroups()).reduce((acc, curr) => {
    acc[curr.order] = curr.id;
    return acc;
  }, {});
  const rate = Number(interaction.fields.getTextInputValue("rate-input"));
  const entries = interaction.fields
    .getTextInputValue("entries-input")
    .split("\n")
    .map((entry) => {
      const fields = entry.split("/");
      return {
        username: fields[0],
        amount: fields[1],
        group: fields[2] ? groups[fields[2]] : "To Be Decided",
        rate: rate,
        channel_id: String(interaction.channelId),
        date: new Date().toISOString(),
      };
    });
  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ugc-add-y")
      .setLabel("Yes")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("ugc-add-n")
      .setLabel("No")
      .setStyle(ButtonStyle.Danger),
  );
  const response = await interaction.reply({
    content: `Please confirm that you are adding:\n${entries.reduce(
      (acc, curr) => {
        acc += `Username: \`${curr.username}\`, Amount: \`${curr.amount}\`, Group: \`${curr.group}\`\n`;
        return acc;
      },
      "",
    )}\nAt rate ${rate}, at channel <#${interaction.channelId}>`,
    flags: MessageFlags.Ephemeral,
    components: [actionRow],
  });

  const filter = (i) => i.user.id == interaction.user.id;
  const collector = response.createMessageComponentCollector({
    filter,
    time: 60_000,
  });

  collector.on("collect", async (i) => {
    await i.deferReply({
      flags: MessageFlags.Ephemeral,
    });
    await interaction.editReply({
      components: [
        new ActionRowBuilder().addComponents(
          actionRow.components.map((button) =>
            ButtonBuilder.from(button).setDisabled(true),
          ),
        ),
      ],
    });
    if (i.customId == "ugc-add-y") {
      await addItems(entries);
      await i.editReply({
        content: "Added to queue",
      });
    }
    if (i.customId == "ugc-add-n") {
      await i.editReply({
        content: "Please resend command with proper entries",
      });
    }
    updateUGCPublicBoard(interaction);
    updateUGCPrivateBoard(interaction);
  });
  return;
}

module.exports = {
  handleEntriesAdd,
};
