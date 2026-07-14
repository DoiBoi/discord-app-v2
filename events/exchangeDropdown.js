const {
  getExchange
} = require("../utils/temp_exchage.js")
const { buildTempModal } = require("../utils/build.js");
const {
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require("discord.js")

async function handleExchangeDropdown(interaction) {
  const item = await getExchange(interaction.values[0]);
  const modal = buildTempModal(interaction.values[0], item);
  await interaction.showModal(modal);

  const oldComponent = interaction.component;

  const clearedMenu = new StringSelectMenuBuilder()
    .setCustomId(oldComponent.customId)
    .setPlaceholder(oldComponent.placeholder)
    .addOptions(
      oldComponent.options.map((opt) => ({
        label: opt.label,
        value: opt.value,
        emoji: opt.emoji || undefined,
      })),
    );

  const row = new ActionRowBuilder().addComponents(clearedMenu);

  await interaction.message.edit({
    components: [row],
  });
  return
}

module.exports = {
  handleExchangeDropdown
}
