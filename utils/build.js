const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  LabelBuilder,
  ChannelSelectMenuBuilder,
  ActionRowBuilder,
  ContainerBuilder,
  SeparatorSpacingSize
} = require("discord.js");
const { getExchanges } = require("./temp_exchage");
const { buildResponse, buildDropdown, ORDER } = require("../commands/public/tempTrigger")

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
  const channel_id = await getId("channel_id");
  const message_id = await getId("message_id");

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
  const container = new ContainerBuilder()
    .addTextDisplayComponents((textDisplay) =>
     textDisplay.setContent("<:zzmilkoke2:1530093885924184064>  **Exchange Completed** <:zzmilkoke1:1530093883747471392>"))
    .addSeparatorComponents((separator) =>
        separator.setDivider(false)
        .setSpacing(SeparatorSpacingSize.Large)
    )
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(`<:BLANK:1530093881826213970>
        <:BLANK:1530093881826213970><:BLANK:1530093881826213970>${ORDER[item.currency]} **\$${amount}** ${item.currency}`)
    )
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(`-# <:BLANK:1530093881826213970><:BLANK:1530093881826213970><:BLANK:1530093881826213970><:BLANK:1530093881826213970><:BLANK:1530093881826213970>to`))
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(`<:BLANK:1530093881826213970><:BLANK:1530093881826213970><:carrots:1474257807212675203> **\$${amount}** Crypto`))
  return container
}

module.exports = {
  buildTempModal,
  buildChannelDropdown,
  updateBoard,
  buildSuccessContainer
};
