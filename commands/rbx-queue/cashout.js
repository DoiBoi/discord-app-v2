const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getQueue, postPending, updateURL } = require("../../utils/queue");
const { ids } = require("../../utils/config");
const { updateQueue } = require("../../utils/build");

const PENDING_TABLE = ids.pending;

function buildActionRow(order) {
  let acc = "";
  for (let i = 0; i < order.length; i++) {
    const curr = order[i];
    if (i >= order.length - 1) {
      acc += `${curr.id}`;
    } else {
      acc += `${curr.id}-`;
    }
  }
  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`cy-${acc}`)
      .setLabel("Complete")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`cn-${acc}`)
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`cc-${acc}`)
      .setLabel("Change User")
      .setStyle(ButtonStyle.Primary),
  );
  return actionRow;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cashout")
    // TODO
    .setDescription("CASHOUT DESC")
    .addNumberOption((option) =>
      option.setName("amount").setDescription("amount").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("order")
        .setDescription(
          "the space separated order in which to take amount from",
        )
        .setRequired(true),
    )
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    let amount = interaction.options.getNumber("amount");
    const order = interaction.options
      .getString("order")
      .split(" ")
      .map((item) => parseInt(item));
    const entries = await getQueue();
    let payload = [];
    for (const item of order) {
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
      payload.push({
        id: entry.id,
        amount: to_add,
        channel: interaction.channelId,
        gfsinfo: entry.gfsinfo,
      });
    }
    console.log(amount)
    if (amount > 0) {
      return await interaction.editReply({
        content:
          "There is not enough available on the specified order to cashout",
      });
    }
    await interaction.editReply({
      content: "Cashout Successful",
    });
    let payout_message = "";
    if (payload.length <= 1) {
      const payload_item = payload[0]
      payout_message = `${payload_item.amount} to \`${payload_item.gfsinfo}\``
    } else {
      payout_message = payload.reduce(
        (acc, curr) => acc + `- ${curr.amount} to \`${curr.gfsinfo}\`\n`,
        "\n",
      );
    }
    payload_data = await postPending(payload);
    const response = await interaction.channel.send({
      content: `Please payout ${payout_message}`,
      components: [buildActionRow(payload_data)],
    });
    await updateURL(payload_data, response.url);
    await updateQueue(interaction);
  },
  buildActionRow,
};
