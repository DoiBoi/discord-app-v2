const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const { addToQueue, getEntry } = require("../../utils/queue");
const { getUserBalance } = require("../../utils/balance");
const { updateQueue } = require("../../utils/build");

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
      InteractionContextType.Guild
    ),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const user = interaction.options.getUser("user");
    const info = interaction.options.getString("info");
    const amount = interaction.options.getNumber("amount");
    const entries = await getEntry(user.id);
    const balance = await getUserBalance(user.id);
    let rbx_bal = balance.balance_rbx;
    for (const entry of entries) {
      rbx_bal -= entry.amount;
    }
    if ((amount && (rbx_bal - amount < 0)) || (rbx_bal < 0)) {
      return interaction.editReply({
        content: "Cannot add to queue as it will result in negative balance"
      })
    }

    if (!interaction.channel) {
      await interaction.editReply({
        content: "No channel name or url was found! Please use this command in a channel where the bot is in"
      })
    }

    await addToQueue(
      user.id,
      info ?? balance.info?.gfs_info,
      interaction.channelId,
      amount ?? rbx_bal,
      interaction.channel.name,
      interaction.channel.url,
    );
    await interaction.editReply({
      content: `Added to queue: \`${info ?? balance.info?.gfs_info}\`: ${amount ?? rbx_bal} `,
    });
    await updateQueue(interaction)
    return;
  },
};
