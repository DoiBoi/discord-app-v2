const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const { addToQueue, getEntries } = require("../../utils/queue");
const { getUserBalance } = require("../../utils/balance");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addentry")
    .setDescription("adds an entry to the queue")
    .addUserOption((option) =>
      option.setName("user").setDescription("TODO").setRequired(true),
    )
    .addNumberOption((option) =>
      option
        .setName("amount")
        .setDescription("(optional) the amount on the listing"),
    )
    .addStringOption((option) =>
      option
        .setName("info")
        .setDescription("(optional) the info to put on the listing"),
    )
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const user = interaction.options.getUser("user");
    const info = interaction.options.getString("info");
    const amount = interaction.options.getNumber("amount");
    const entries = await getEntries(user.id);
    const balance = await getUserBalance(user.id);
    let rbx_bal = balance.balance_rbx;
    for (const entry of entries) {
      rbx_bal -= entry.amount;
    }
    if ((amount && (rbx_bal - amount <= 0)) || (rbx_bal <= 0)) {
      return interaction.editReply({
        content: "Cannot add to queue as it will result in negative or zero balance"
      })
    }

    await addToQueue(
      user.id,
      info ?? balance.info?.gfs_info,
      interaction.channelId,
      amount ?? rbx_bal,
    );
    await interaction.editReply({
      content: `Added to queue: \`${info ?? balance.info?.gfsinfo}\`: ${amount ?? rbx_bal} `,
    });
    return;
  },
};
