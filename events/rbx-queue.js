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
} = require("../utils/queue");
const { disableButtonRow } = require("../utils/build");
const { ids } = require("../utils/config");

const REGEX = /\d+/gm;
const PENDING_TABLE = ids.pending

async function handlePendingYes(interaction) {
  const matches = interaction.customId.match(REGEX);
  const data = await getEntries(matches);
  await interaction.deferUpdate();
  // interaction.reply({
  //   content: data,
  //   flags: MessageFlags.Ephemeral
  // })
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

    const response = await hasImage.reply({
      content: "Is this the correct item to forward?",
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
      await i.deferUpdate();
      const forwarded_channels = [];
      await finalizeCashout(data);
      for (const item of data) {
        try {
          const forward_channel = await interaction.client.channels.fetch(
            String(item.queue_id.buyer_channel),
          );
          const forwarded = await hasImage.forward(forward_channel);
          forwarded_channels.push(forwarded.url);
        } catch {
          console.log("Channel not found");
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

  const text = new TextDisplayBuilder().setContent(await showQueue(matches));

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
    await submission.deferReply()
    const newOrder = submission.fields
      .getTextInputValue("c-change-input")
      .split(" ")
      .map((item) => parseInt(item));

    const entries = await getQueue();
    let payload = [];
    const amount = entries.filter((item) => {

    })
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
        id: entry.id,
        amount: to_add,
        channel: interaction.channelId,
        gfsinfo: entry.gfsinfo,
      }
      if (matches[i]) {
        payload_item.pending_id = matches[i]
      }
      payload.push(payload_item);
    }
    if (amount > 0) {
      return await interaction.editReply({
        content:
          "There is not enough available on the specified order to cashout",
      });
    }
    // await disableButtonRow(interaction);
    // payload_data = await postPending(payload);

    await submission.editReply({
      content: `New order: ${newOrder}`,
    });
  } catch (error) {
    console.error(error);
  }

  return;
}

module.exports = {
  handlePendingChange,
  handlePendingNo,
  handlePendingYes,
};
