const { SlashCommandBuilder, InteractionContextType, MessageFlags, ActionRowBuilder } = require('discord.js');
const { getExchanges, getExchange, removeExchange } = require('../../utils/temp_exchage');
const { buildDropdown } = require('./tempTrigger');
const { supabase } = require('../../utils/supabase/supabase_client');
const { updateBoard } = require('../../utils/build');


module.exports = {
  data: new SlashCommandBuilder()
    .setName("remtrigger")
    .setDescription("Creates a prompt to remove specified temp exchange")
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
  async execute(interaction) {
    const exchanges = await getExchanges()
    if (exchanges.length < 0) {
      return await interaction.reply({
        content: "There is no exchanges to be removed",
        flags: MessageFlags.Ephemeral
      })
    }

    const dropdown = buildDropdown(exchanges)

    const response = await interaction.reply({
      content: "Select which exchange to delete:",
      components: [new ActionRowBuilder().addComponents(dropdown)],
      flags: MessageFlags.Ephemeral
    })

    const filter = (i) => i.user.id === interaction.user.id;

    const collector = response.createMessageComponentCollector({
      time: 60_000,
      filter: filter
    })

    collector.on("collect", async (i) => {
      await i.deferReply({
        flags: MessageFlags.Ephemeral
      })
      const item = await getExchange(interaction.values[0]);
      await removeExchange(item)
      await updateBoard(i)
      await i.editReply("Exchange removed")
    })
  }
}
