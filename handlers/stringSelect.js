const { handleExchangeDropdown, handleChannelDropdown } = require("../events/exchangeDropdown")

async function handleStringSelect(interaction) {
  switch (interaction.customId) {
    case "dropdown":
      handleExchangeDropdown(interaction)
    case "select-channel":
      handleChannelDropdown(interaction)
      break;
    default:
      await interaction.deferReply();
  }
}

module.exports = {
  handleStringSelect
}
