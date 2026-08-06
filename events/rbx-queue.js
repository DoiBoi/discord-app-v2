const {
  MessageFlags,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
  LabelBuilder,
  TextInputStyle,
  TextDisplayBuilder,
} = require("discord.js");
const {
  getEntries,
  finalizeCashout,
  deletePendings,
  showQueue,
  postPending,
  getQueue,
  updateURL,
} = require("../utils/queue");
const { disableButtonRow, updateQueue } = require("../utils/build");
const { ids } = require("../utils/config");
const { buildActionRow } = require("../commands/rbx-queue/cashout");
const { getUserInfo } = require("../utils/balance");
const { setGfs } = require("../utils/gfs");
const { appendUserHistory } = require("../utils/history");

const REGEX = /\d+/gm;
const PENDING_TABLE = ids.pending;
const FLAGS = {
  gfs_toggle: true,
  owe_toggle: false,
  info_toggle: false,
  new_line: false,
};

async function handlePendingYes(interaction) {
  const matches = interaction.customId.match(REGEX);
  const data = await getEntries(matches);
  await interaction.deferUpdate();
  try {
    const messages = await interaction.channel.messages.fetch({ limit: 5 });
    const hasImage = messages.find((msg) => {
      const hasAttachment = msg.attachments.some((att) =>
        att.contentType?.startsWith("image/"),
      );
      const hasUploadedVideo = msg.attachments.some((attachment) =>
        attachment.contentType?.startsWith("video/"),
      );

      const hasEmbeddedVideo = msg.embeds.some(
        (embed) => embed.video || embed.data.video,
      );
      const hasEmbed = msg.embeds.some((emb) => emb.image || emb.thumbnail);
      const notSelf = msg.author.id !== interaction.guild.members.me.id;
      return (
        (hasAttachment || hasEmbed || hasUploadedVideo || hasEmbeddedVideo) &&
        notSelf
      );
    });
    if (!hasImage) {
      return interaction.followUp({
        content: "Pending proof not found!",
        flags: MessageFlags.Ephemeral,
      });
    }

    const response = await interaction.followUp({
      content: `Is ${hasImage.url} the correct item to forward?`,
      flags: MessageFlags.Ephemeral,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("c-foward-proceed")
            .setLabel("Yes")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("c-forward-cancel")
            .setLabel("No")
            .setStyle(ButtonStyle.Danger),
        ),
      ],
    });

    const filter = (i) =>
      interaction.user.id === i.user.id &&
      (i.customId === "c-foward-proceed" || i.customId === "c-forward-cancel");

    const collector = response.createMessageComponentCollector({
      filter,
      time: 60_000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "c-forward-cancel") {
        return await i.reply({
          content: "Please send the correct proof then click complete again",
        });
      }
      await disableButtonRow(i);
      await disableButtonRow(interaction);
      // await i.deferUpdate();
      const forwarded_channels = [];
      const cashoutResult = await finalizeCashout(data);
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const cashoutItem = cashoutResult[i];
        const result = cashoutItem.balances;
        try {
          // HOTFIX
          const url = String(item.queue_id.buyer_channel)
          const match = url.match(/\/channels\/(?:@me|\d+)\/(\d+)/);
          const channelId = match ? match[1] : null;

          const forward_channel = await interaction.client.channels.fetch(
            channelId ? String(channelId) : String(item.queue_id.buyer_channel),
          );
          const forwarded = await hasImage.forward(forward_channel);
          forwarded_channels.push(forwarded.url);
          await forward_channel.send({
            content: `**New Balance:** \$${result.balance_usd.toFixed(2)} USD, ${result.balance_rbx.toFixed(2)} RBX\n-# :red_circle: Subtracted ${item.amount} RBX from ${cashoutItem.balance_id ? `<@${cashoutItem.balance_id}>` : ""}'s balance\n||-# (**Previous balance:** \$${cashoutItem.prev_rbx} RBX${getUserInfo(result.info, FLAGS) !== "" ? `, ${getUserInfo(result.info, FLAGS)}` : ""})||`,
            flags: [MessageFlags.SuppressNotifications],
          });
          if (item.queue_id.amount - item.amount <= 0) {
            await setGfs(cashoutItem.balance_id, false);
            await interaction.followUp({
              content: "GFS removed",
              flags: MessageFlags.Ephemeral,
            });
          }
          await appendUserHistory(cashoutItem.balance_id, "rbx", [-item.amount]);
        } catch (error) {
          console.error(`An error occured in handlePendingYes\n${error}`);
        }
      }
      if (forwarded_channels.length <= 0) {
        return await interaction.followUp({
          content: "No messages forwarded!",
          flags: MessageFlags.Ephemeral,
        });
      }
      await interaction.followUp({
        content: forwarded_channels.reduce((acc, curr) => {
          acc += curr + " ";
          return acc;
        }, "Image forwarded in "),
        flags: MessageFlags.Ephemeral,
      });
      await updateQueue(interaction);
    });
  } catch (error) {
    console.error(error.message);
    await interaction.followUp({
      content: "Something went wrong!",
      flags: MessageFlags.Ephemeral,
    });
  }
  return;
}

async function handlePendingNo(interaction) {
  await disableButtonRow(interaction);
  await interaction.deferReply();
  const matches = interaction.customId.match(REGEX);
  const data = await deletePendings(matches);

  await interaction.editReply({
    content: "Interaction cancelled",
  });
}

async function handlePendingChange(interaction) {
  // TODO: implement
  const matches = interaction.customId.match(REGEX);
  const modal = new ModalBuilder()
    .setCustomId(`c-change-user`)
    .setTitle("Change User");

  const input = new TextInputBuilder()
    .setCustomId("c-change-input")
    .setPlaceholder("e.g. 10")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const label = new LabelBuilder()
    .setLabel("What is the new order?")
    .setTextInputComponent(input);

  const text = new TextDisplayBuilder().setContent((await showQueue(matches)).content);

  modal.addTextDisplayComponents(text);
  modal.addLabelComponents(label);
  interaction.showModal(modal);

  const filter = (i) =>
    i.customId === "c-change-user" && i.user.id === interaction.user.id;

  try {
    const submission = await interaction.awaitModalSubmit({
      filter,
      time: 60_000,
    });
    await submission.deferReply();
    const newOrder = submission.fields
      .getTextInputValue("c-change-input")
      .split(" ")
      .map((item) => parseInt(item));

    const entries = await getQueue();
    let payload = [];
    let ids = [];
    let amount = entries.reduce((acc, entry) => {
      const pendings = entry[PENDING_TABLE];
      acc += pendings.reduce((pending_acc, pending) => {
        if (matches.includes(String(pending.id))) {
          pending_acc += pending.amount;
        }
        return pending_acc;
      }, 0);
      return acc;
    }, 0);
    for (let i = 0; i < newOrder.length; i++) {
      const item = newOrder[i];
      const entry = entries[item - 1];
      const pending_sum = entry[PENDING_TABLE].reduce(
        (acc, curr) => acc + curr.amount,
        0,
      );
      const to_add = Math.min(entry.amount - pending_sum, amount);
      if (to_add <= 0) {
        continue;
      }
      amount -= to_add;
      if (amount < 0) {
        break;
      }
      const payload_item = {
        id: Number(entry.id),
        amount: to_add,
        channel: interaction.channelId,
        gfsinfo: entry.gfsinfo,
      };
      if (matches[i]) {
        payload_item.pending_id = matches[i];
        ids.push(matches[i]);
      }
      payload.push(payload_item);
    }
    if (amount > 0) {
      return await submission.editReply({
        content:
          "There is not enough available on the specified order to cashout",
      });
    }
    await disableButtonRow(interaction);
    const remaining = matches.filter((item) => !ids.includes(item));
    if (remaining.length > 0) {
      await deletePendings(remaining);
    }
    payload_data = await postPending(payload);
    let payout_message = "";
    if (payload.length <= 1) {
      const payload_item = payload[0];
      payout_message = `${payload_item.amount} to \`${payload_item.gfsinfo}\``;
    } else {
      payout_message = payload.reduce(
        (acc, curr) => acc + `- ${curr.amount} to \`${curr.gfsinfo}\`\n`,
        "\n",
      );
    }
    const response = await submission.editReply({
      content: `Please payout ${payout_message}`,
      components: [buildActionRow(payload_data)],
    });

    await updateURL(payload_data, response.url);
    await updateQueue(interaction);
  } catch (error) {
    // console.error(error);
  }

  return;
}

module.exports = {
  handlePendingChange,
  handlePendingNo,
  handlePendingYes,
};
