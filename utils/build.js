const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  LabelBuilder,
  ChannelSelectMenuBuilder,
  ActionRowBuilder,
  ContainerBuilder,
  SeparatorSpacingSize,
} = require("discord.js");
const { getExchanges } = require("./temp_exchage");
const {
  buildResponse,
  buildDropdown,
  ORDER,
} = require("../commands/public/tempTrigger");

const { getId } = require("./id");
const { emojis, ids } = require("./config");
const { EmbedBuilder } = require("discord.js");
const CHANNEL = ids.channel_id;
const MESSAGE = ids.message_id;
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
    .setDescription(`Minimum: \$${min}, Maximum: \$${max}`)
    .setTextInputComponent(input);

  modal.addLabelComponents(label);

  return modal;
}

function buildChannelDropdown() {
  const channelMenu = new ChannelSelectMenuBuilder()
    .setCustomId("select-channel")
    .setPlaceholder("Select channel...");

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

  await message.edit({
    content: buildResponse(
      exchanges,
      interaction.message.mentions.roles.size > 0,
    ),
    components: dropdownRow,
  });
}

function buildSuccessContainer(item, amount) {
  const embed = new EmbedBuilder().setTitle(
    `${OKE2}  **Exchange Completed**  ${OKE1}`,
  ).setDescription(`${BLANK}
    ${BLANK}${BLANK}${BLANK}${ORDER[item.currency]} **\$${amount}** ${item.currency}\n-# ${BLANK}${BLANK}${BLANK}${BLANK}${BLANK}to
    ${BLANK}${BLANK}${BLANK}<:crypto:${emojis.crypto}> **\$${amount}** Crypto`);
  return embed;
}

module.exports = {
  buildTempModal,
  buildChannelDropdown,
  updateBoard,
  buildSuccessContainer,
};
