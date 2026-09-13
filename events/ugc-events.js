const { MessageFlags, ButtonStyle, ChannelType } = require("discord.js");
const { fetchGroups, addItems, getItemByChannel, getItems, assignGroups } = require("../utils/ugc");
const { ActionRowBuilder } = require("discord.js");
const { ButtonBuilder } = require("discord.js");
const { updateUGCBoards } = require("../utils/build");
const { ChannelSelectMenuBuilder } = require("discord.js");
const { ids } = require("../utils/config");

const TABLE = ids.ugc_queue;

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
    updateUGCBoards(interaction);
  });
  return;
}

async function handleCheckStatus(interaction) {
  await interaction.reply({
    content:
      "Please select which channel to check status in (it should be your the channel you are doing the exchange in)",
    components: [
      new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId("check-channel-status")
          .addChannelTypes(ChannelType.GuildText),
      ),
    ],
    flags: MessageFlags.Ephemeral,
  });
  const response = await interaction.fetchReply();

  const filter = (i) => i.user.id == interaction.user.id;
  const collector = response.createMessageComponentCollector({
    filter,
    time: 60_000,
  });

  collector.on("collect", async (i) => {
    await interaction.editReply({
      components: [],
    });
    await i.deferReply({
      flags: MessageFlags.Ephemeral,
    });
    const selected = i.values[0];
    const data = await getItemByChannel(selected);
    if (data.length <= 0) {
      return i.editReply({
        content: "No entries found!",
      });
    }
    await i.editReply({
      content: `${data.reduce((acc, curr) => {
        const userContent = curr[TABLE].map((item) => {
          return `- \`${item.username}\` ${item.amount}`;
        }).join("\n");
        acc += `# ${curr.id}\n${userContent}\n`;
        return acc;
      }, "The current status(es) of your item(s):\n")}`,
    });
    return;
  });
}

async function handleAssignGroup(interaction) {
  const groups = (await fetchGroups()).reduce((acc, curr) => {
    acc[curr.order] = curr.id;
    return acc;
  }, {});
  const fetchEntries = await getItems();
  const entries = interaction.fields
    .getTextInputValue("entries-input")
    .split("\n")
    .map((item) => {
      const text_split = item.split("/");
      return {
        group: groups[text_split[0]],
        ids: text_split[1]
          .split(" ")
          .map((item) => fetchEntries[Number(item) - 1] ? fetchEntries[Number(item) - 1] : null)
          .filter((ids) => ids),
      };
    });

  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ugc-edit-y")
      .setLabel("Yes")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("ugc-edit-n")
      .setLabel("No")
      .setStyle(ButtonStyle.Danger),
  );
  const response = await interaction.reply({
    content: `Please confirm that you are assigning:\n${entries.reduce(
      (acc, curr) => {
        acc += `${curr.ids.map((item) => `\`${item.username}\`: ${item.group} to ${curr.group}`).join("\n")}\n`
        return acc;
      },
      "",
    )}`,
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
    if (i.customId == "ugc-edit-y") {
      console.log(entries)
      await assignGroups(entries);
      await i.editReply({
        content: "Successfully assigned",
      });
    }
    if (i.customId == "ugc-edit-n") {
      await i.editReply({
        content: "Please resend command with proper entries",
      });
    }
    updateUGCBoards(interaction);
  });
  return;
}

module.exports = {
  handleEntriesAdd,
  handleCheckStatus,
  handleAssignGroup,
};
