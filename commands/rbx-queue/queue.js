const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { showQueue } = require("../../utils/queue")

module.exports = {
  // TODO: clean description
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription('Show the current gfs queue')
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
  async execute(interaction) {
    await interaction.reply({
      content: await showQueue(),
      flags: MessageFlags.Ephemeral
    })
  }
}
