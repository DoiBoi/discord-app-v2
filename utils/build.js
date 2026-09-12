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
const { getItems, fetchItems, fetchGroups } = require("./ugc");
const CHANNEL = ids.channel_id;
const MESSAGE = ids.message_id;
const QUEUE_CHANNEL = ids.queue_channel;
const QUEUE_MESSAGE = ids.queue_message;
const GROUP = ids.groups;
const BLANK = `<:BLANK:${emojis.blank}>`;
const OKE1 = `<:zzmilkoke1:${emojis.oke1}>`;
const OKE2 = `<:zzmilkoke2:${emojis.oke2}>`;
const DISCORD_REGEX = /channels\/([^\/]+)\/(\d+)\/(\d+)/;
const TABLE = ids.ugc_queue;

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
    content: buildResponse(exchanges),
    components: dropdownRow,
  });
  await upsertId(MESSAGE, updatedMessage.id);

  return updatedMessage;
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

  const firstPageButton = new ButtonBuilder()
    .setCustomId(`c-fpage`)
    .setStyle(ButtonStyle.Primary)
    .setEmoji("⏪");

  const rightButton = new ButtonBuilder()
    .setCustomId(`c-right-${queuePage}`)
    .setStyle(ButtonStyle.Primary)
    .setEmoji("➡️");

  const lastPageButton = new ButtonBuilder()
    .setCustomId(`c-lpage-${maxPage - 1}`)
    .setStyle(ButtonStyle.Primary)
    .setEmoji("⏩");

  if (page - 1 < 0) {
    leftButton.setDisabled(true);
    firstPageButton.setDisabled(true);
  }
  if (page + 1 >= maxPage) {
    rightButton.setDisabled(true);
    lastPageButton.setDisabled(true);
  }

  try {
    const channel = await interaction.client.channels.fetch(String(channel_id));
    try {
      const message = await channel.messages.fetch(String(message_id));
      await message.edit({
        content: text,
        components: [
          new ActionRowBuilder().setComponents(
            firstPageButton,
            leftButton,
            rightButton,
            lastPageButton,
          ),
        ],
      });
    } catch {
      const sent_message = await channel.send({
        content: text,
        components: [
          new ActionRowBuilder().setComponents(
            firstPageButton,
            leftButton,
            rightButton,
            lastPageButton,
          ),
        ],
      });
      await upsertId(QUEUE_MESSAGE, sent_message.id);
    }
  } catch (error) {
    console.error(error.message);
  }
}

function parseDiscordId(url) {
  const matches = url.match(DISCORD_REGEX);
  return [matches[1] ?? "", matches[2] ?? "", matches[3] ?? ""];
}

async function updateUGCPublicBoard(interaction) {
  const channel_id = await getId(ids.ugc_public_channel);
  const message_id = await getId(ids.ugc_public_message);

  if (!channel_id) {
    console.log("channel and/or message not initiated");
    return;
  }
  const entries = (await fetchGroups()).map((curr) => {
    return {
      name: curr.id,
      amount: curr[TABLE].reduce((table_acc, table_curr) => {
        table_acc -= table_curr.amount;
        return table_acc;
      }, curr.amount),
      queue: curr[TABLE].length,
    };
  });
  const content = entries.reduce((acc, curr, idx) => {
    if (idx % 3 == 0) {
      acc += `INSERT EMOJI ${idx / 3}\n`;
    }
    acc += `**${curr.name}** - ${curr.amount >= 0 ? curr.amount.toLocaleString() : "PRE-ORDERED"}${curr.queue > 0 ? `\nQueue: ${curr.queue} ${curr.queue == 1 ? "person" : "people"}` : ""}\n`;
    return acc;
  }, "");
  try {
    const channel = await interaction.client.channels.fetch(String(channel_id));
    let message = await channel.messages.fetch(String(message_id));
    await message.edit({
      content,
    });
  } catch (error) {
    const channel = await interaction.client.channels.fetch(String(channel_id));
    const message = await channel.send({
      content,
    });
    upsertId(ids.ugc_public_message, message.id);
  }
}

async function updateUGCPrivateBoard(interaction) {
  const channel_id = await getId(ids.ugc_private_channel);

  if (!channel_id) {
    console.log("channel not initiated");
    return;
  }

  try {
    const channel = await interaction.client.channels.fetch(String(channel_id));
    for (let i = 0; i < 4; i++) {
      // const message_id = await getId(`${ids.ugc_private_message}_${i}`);
      // const message = await channel.messages.fetch(String(message_id));
      const entries = (await fetchGroups())
        .slice(i * 3, (i + 1) * 3)
        .map((item) => {
          return {
            name: item.id,
            amount: item.amount,
            order: item.order,
            users: item[TABLE].reduce((acc, curr) => {
              if (!acc[curr.channel_id]) {
                acc[curr.channel_id] = [];
              }
              acc[curr.channel_id].push(curr);
              return acc;
            }, {}),
          };
        });
      const content = entries.reduce((acc, curr) => {
        const usersText = Object.entries(curr.users).map(
          ([channelId, rows]) => {
            const rowsText = rows
              .map(
                (row) =>
                  `- \`${row.username}\` ${row.amount} ${row.log ? "Recorded" : "Not Recorded"}`,
              )
              .join("\n");
            return `<#${channelId}> (${rows[0].rate})\n${rowsText}\n`;
          },
        ).join("\n");
        acc += `# ${curr.name} (${curr.order}) ${curr.amount}\n${usersText}`;
        return acc;
      }, `EMOJI ${i}\n`);
      console.log(content)
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
  parseDiscordId,
  updateUGCPrivateBoard,
  updateUGCPublicBoard,
};
