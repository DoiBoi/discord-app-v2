const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  LabelBuilder,
  ChannelSelectMenuBuilder,
  ActionRowBuilder,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getExchanges } = require("./temp_exchage");
const {
  buildResponse,
  buildDropdown,
  ORDER,
} = require("../commands/public/tempTrigger");

const { getId, upsertId } = require("./id");
const { emojis, ids } = require("./config");
const { EmbedBuilder } = require("discord.js");
const { showQueue } = require("./queue");
const CHANNEL = ids.channel_id;
const MESSAGE = ids.message_id;
const QUEUE_CHANNEL = ids.queue_channel;
const QUEUE_MESSAGE = ids.queue_message;
const BLANK = `<:BLANK:${emojis.blank}>`;
const OKE1 = `<:zzmilkoke1:${emojis.oke1}>`;
const OKE2 = `<:zzmilkoke2:${emojis.oke2}>`;

function buildTempModal(id, item) {
  const amount = item["amount"] - item["pending"];
  const min = item["min"] > amount ? amount : item["min"];
  const max = amount;

  const modal = new ModalBuilder()
    .setCustomId(`temp-popup-${id}`)
    .setTitle("Claim an Exchange");

  const input = new TextInputBuilder()
    .setCustomId("temp-input")
    .setPlaceholder("e.g. 10")
    .setStyle(TextInputStyle.Short);

  const label = new LabelBuilder()
    .setLabel("How much are you sending?")
    .setDescription(
      `Minimum: \$${min.toFixed(2)}, Maximum: \$${max.toFixed(2)}`,
    )
    .setTextInputComponent(input);

  modal.addLabelComponents(label);

  return modal;
}

function buildChannelDropdown() {
  const channelMenu = new ChannelSelectMenuBuilder()
    .setCustomId("select-channel")
    .setPlaceholder("Select channel...")
    .setChannelTypes(ChannelType.GuildText);

  const row = new ActionRowBuilder().addComponents(channelMenu);

  return row;
}

async function updateBoard(interaction) {
  let channel, message;
  const channel_id = await getId(CHANNEL);
  const message_id = await getId(MESSAGE);

  try {
    channel = await interaction.client.channels.fetch(String(channel_id));
  } catch {}

  try {
    message = await channel.messages.fetch(String(message_id));
  } catch {}
  const exchanges = await getExchanges();
  const hasExchanges = Object.values(exchanges).some((items) =>
    items.some(
      (item) => Math.round((item.amount - item.pending) * 100) / 100 > 0,
    ),
  );

  const dropdown = hasExchanges ? buildDropdown(exchanges) : null;
  const dropdownRow = dropdown
    ? [new ActionRowBuilder().addComponents(dropdown)]
    : [];

  const updatedMessage = await message.edit({
    content: buildResponse(
      exchanges,
      interaction.message.mentions.roles.size > 0,
    ),
    components: dropdownRow,
  });
  await upsertId(MESSAGE, updatedMessage.id)
}

function buildSuccessContainer(item, amount) {
  const embed = new EmbedBuilder().setTitle(
    `${OKE2}  **Exchange Completed**  ${OKE1}`,
  ).setDescription(`${BLANK}
    ${BLANK}${BLANK}${ORDER[item.currency]} **\$${Number(amount).toFixed(2)}** ${item.currency}\n-# ${BLANK}${BLANK}${BLANK}${BLANK}${BLANK}to
    ${BLANK}${BLANK}<:crypto:${emojis.crypto}> **\$${((Number(amount) * (100 - item.fee)) / 100).toFixed(2)}** Crypto`);
  return embed;
}

async function disableButtonRow(interaction, message = null) {
  if (message && message.components && message.components.length > 0) {
    return await message.edit({
      components: [
        new ActionRowBuilder().addComponents(
          message.components[0].components.map((button) =>
            ButtonBuilder.from(button).setDisabled(true),
          ),
        ),
      ],
    });
  }

  try {
    await interaction.message.edit({
      components: [
        new ActionRowBuilder().addComponents(
          interaction.message.components[0].components.map((button) =>
            ButtonBuilder.from(button).setDisabled(true),
          ),
        ),
      ],
    });
  } catch {
    await interaction.update({
      components: [
        new ActionRowBuilder().addComponents(
          interaction.message.components[0].components.map((button) =>
            ButtonBuilder.from(button).setDisabled(true),
          ),
        ),
      ],
    });
  }
}

async function updateQueue(interaction, page = 0) {
  const { content: text, maxPage, page: queuePage } = await showQueue([], page);
  const channel_id = await getId(QUEUE_CHANNEL);
  const message_id = await getId(QUEUE_MESSAGE);
  const leftButton = new ButtonBuilder()
    .setCustomId(`c-left-${queuePage}`)
    .setStyle(ButtonStyle.Primary)
    .setEmoji("⬅️");
  if (page - 1 < 0) {
    leftButton.setDisabled(true);
  }

  const rightButton = new ButtonBuilder()
    .setCustomId(`c-right-${queuePage}`)
    .setStyle(ButtonStyle.Primary)
    .setEmoji("➡️");

  if (page + 1 >= maxPage) {
    rightButton.setDisabled(true);
  }

  try {
    const channel = await interaction.client.channels.fetch(String(channel_id));
    try {
      const message = await channel.messages.fetch(String(message_id));
      await message.edit({
        content: text,
        components: [
          new ActionRowBuilder().setComponents(leftButton, rightButton),
        ],
      });
    } catch {
      const sent_message = await channel.send({
        content: text,
        components: [
          new ActionRowBuilder().setComponents(leftButton, rightButton),
        ],
      });
      await upsertId(QUEUE_MESSAGE, sent_message.id);
    }
  } catch (error) {
    console.error(error.message);
  }
}

module.exports = {
  buildTempModal,
  buildChannelDropdown,
  updateBoard,
  buildSuccessContainer,
  disableButtonRow,
  updateQueue,
};
