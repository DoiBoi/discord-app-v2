const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
} = require("discord.js");
const {
  getQueue,
} = require("../../utils/queue");
const { ids } = require("../../utils/config");

const PENDING_TABLE = ids.pending;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queuestats")
    .setDescription("Gets stats on the queue")
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ),
  async execute(interaction) {
    const queue = await getQueue()

    let totalPending = 0
    const totalBuying = queue.reduce((acc, curr) => {
      acc += curr.amount;
      totalPending += curr[PENDING_TABLE].reduce((acc, curr) => acc = acc + curr.amount, 0)
      return acc
    }, 0)
    await interaction.reply({
      content: `The total amount buying is ${totalBuying.toLocaleString()} RBX and the total amount pending is ${totalPending.toLocaleString()} RBX and ${queue.length} entries`
    })
  }
  }
