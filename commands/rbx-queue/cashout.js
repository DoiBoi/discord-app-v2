const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getQueue, postPending } = require("../../utils/queue");

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
      const pending_sum = entry.pendings.reduce((acc, curr) => acc + curr, 0);
      const to_add = Math.min(entry.amount - pending_sum, amount);
      amount -= to_add;
      entry.pendings.push(to_add)
      entry.seller_channels.push(interaction.channelId)
      payload.push({
        id: entry.id,
        amount: entry.amount,
        pendings: entry.pendings,
        seller_channels: entry.seller_channels,
        gfsinfo: entry.gfsinfo
      });
      if (amount <= 0) {break}
    }
    if (amount > 0) {
      return await interaction.editReply({
        content:
          "There is not enough available on the specified order to cashout",
      });
    }
    await postPending(payload)
    await interaction.editReply({
      content: "Cashout Successful",
    });
    const payout_message = payload.reduce(
      (acc, curr) =>
        acc +
        `- ${curr.pendings[curr.pendings.length - 1]} to \`${curr.gfsinfo}\`\n`,
      "\n",
    );
    await interaction.channel.send({
      content: `Please payout ${payout_message}`,
    });
  },
};
