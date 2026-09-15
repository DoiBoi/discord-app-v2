const { MessageFlags, ButtonStyle, ChannelType } = require("discord.js");
const {
  fetchGroups,
  addItems,
  getItemByChannel,
  getItems,
  assignGroups,
  editStock,
  subtractEntries,
  removeItems,
} = require("../utils/ugc");
const { ActionRowBuilder } = require("discord.js");
const { ButtonBuilder } = require("discord.js");
const { updateUGCBoards, disableButtonRow } = require("../utils/build");
const { ChannelSelectMenuBuilder } = require("discord.js");
const { ids } = require("../utils/config");
const { getId } = require("../utils/id");

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
    .filter((line) => line.trim() !== "")
    .filter((line) => line.split("/").length >= 2)
    .map((entry) => {
      const [username, amount, group] = entry.split("/");
      return {
        username: username,
        amount: Number(amount.replace(/,/g, "").trim()),
        group: group ? group.toUpperCase().trim() : "LUV$OSA",
        rate: Number(rate),
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
    .filter((line) => line.trim() !== "")
    .filter((line) => line.split("/").length == 2)
    .map((item) => {
      const [group, ids] = item.split("/");
      return {
        group: groups[group.toUpperCase().trim()],
        ids: ids
          .split(" ")
          .map((item) =>
            fetchEntries[Number(item) - 1]
              ? fetchEntries[Number(item) - 1]
              : null,
          )
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
        acc += `${curr.ids.map((item) => `\`${item.username}\`: ${item.group} to ${curr.group}`).join("\n")}\n`;
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
      console.log(entries);
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

async function handleStockGroup(interaction) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });
  const groups = (await fetchGroups()).reduce((acc, curr) => {
    acc[curr.order] = curr;
    return acc;
  }, {});
  const entries = interaction.fields
    .getTextInputValue("entries-input")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .filter(
      (line) => line.split("/").length == 2 && line.split("/")[1].trim() !== "",
    )
    .map((item) => {
      const [gr, amount] = item.split("/");
      return {
        group: groups[gr.toUpperCase().trim()],
        amount: Number(amount.replace(/,/g, "").trim()),
      };
    });

  const response = await interaction.editReply({
    content: `Please confirm these are the new values you want:\n${entries
      .map((item) => {
        return `${item.group.id}: ${item.group.amount} to ${item.amount}`;
      })
      .join("\n")}`,
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ugc-stock-y")
          .setLabel("Yes")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("ugc-stock-n")
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
    if (i.customId == "ugc-stock-n") {
      return await i.reply({
        content: "Stocking cancelled, please retry with updated numbers",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (i.customId == "ugc-stock-y") {
      await i.deferReply({
        flags: MessageFlags.Ephemeral,
      });
      const data = await editStock(entries);
      await i.editReply({
        content: `Updated ${data.length} entries`,
      });
      await updateUGCBoards(i);
    }
  });
}

async function handlePayUGC(interaction) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });
  const fetchEntries = await getItems();
  const entries = interaction.fields
    .getTextInputValue("entries-input")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .filter((line) => line.split("/").length >= 2)
    .map((item) => {
      const [position, amount] = item.split("/");
      return {
        entry: fetchEntries[Number(position) - 1],
        amount: Number(amount.replace(/,/g, "").trim()),
      };
    });
  const response = await interaction.editReply({
    content: `Please confirm these are the entries you want to pay:\n${entries
      .map((item) => {
        return `\`${item.entry.username}\`: ${item.entry.amount}-${item.amount}=${item.entry.amount - item.amount}`;
      })
      .join("\n")}`,
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ugc-pay-y")
          .setLabel("Yes")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("ugc-pay-n")
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
    if (i.customId == "ugc-pay-n") {
      return await i.reply({
        content: "Payment cancelled, please retry with new amount",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (i.customId == "ugc-pay-y") {
      await i.deferReply({
        flags: MessageFlags.Ephemeral,
      });
      let messageURL;
      const toRemove = entries.filter(
        (item) => item.entry.amount - item.amount <= 0,
      );
      if (toRemove.length > 0) {
        try {
          const channel = await i.client.channels.fetch(
            String(await getId(ids.reminder)),
          );

          const message = await channel.send({
            content: `Make sure to update the spreadsheet for:\n${toRemove
              .map((item) => {
                return `\`${item.entry.username}\`: ${item.entry.amount}-${item.amount}=${item.entry.amount - item.amount}`;
              })
              .join("\n")}`,
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("spreadsheet-u")
                  .setLabel("I updated")
                  .setStyle(ButtonStyle.Success),
              ),
            ],
          });
          messageURL = message.id;
        } catch (error) {
          console.error(error);
        }
      }
      const data = await subtractEntries(entries, messageURL);
      await i.editReply({
        content: `Updated ${data.length} entries`,
      });
      await updateUGCBoards(i);
    }
  });
}

async function handleUpdatedSpreadsheet(interaction) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });
  await disableButtonRow(interaction);
  const entries = (await getItems()).filter(
    (item) => item.reminder_message == String(interaction.message.id),
  );
  const data = await removeItems({
    ids: entries.map((item) => item.id),
  });
  console.log(entries);
  await interaction.editReply({
    content: `Successfully removed ${data.length} item${data.length > 1 ? "s" : ""}`,
  });
  await updateUGCBoards(interaction);
}

module.exports = {
  handleEntriesAdd,
  handleCheckStatus,
  handleAssignGroup,
  handleStockGroup,
  handlePayUGC,
  handleUpdatedSpreadsheet,
};
