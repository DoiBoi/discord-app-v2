const { MessageFlags, ActionRowBuilder, ButtonStyle } = require("discord.js");
const { getEntries, finalizeCashout, cancelCashout } = require("../utils/queue");
const { ButtonBuilder } = require("discord.js");

const REGEX = /\d+/gm;

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
      await i.message.edit({
        components: [
          new ActionRowBuilder().addComponents(
            i.message.components[0].components.map((button) =>
              ButtonBuilder.from(button).setDisabled(true),
            ),
          ),
        ],
      });
      await interaction.message.edit({
        components: [
          new ActionRowBuilder().addComponents(
            interaction.message.components[0].components.map((button) =>
              ButtonBuilder.from(button).setDisabled(true),
            ),
          ),
        ],
      });
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
  const matches = interaction.customId.match(REGEX);

  return;
}

async function handlePendingChange(interaction) {
  return;
}

module.exports = {
  handlePendingChange,
  handlePendingNo,
  handlePendingYes,
};
