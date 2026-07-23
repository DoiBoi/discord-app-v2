const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  LabelBuilder,
  ChannelSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");
const { getExchanges, buildResponse } = require("./temp_exchage");
const { getId } = require("./id");

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
  const channel_id = await getId("dummy_channel_id");
  const message_id = await getId("dummy_message_id");

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

module.exports = {
  buildTempModal,
  buildChannelDropdown,
  updateBoard,
};
