const { handlePopUp } = require("../events/tempPopUp")

async function handleModalSelect(interaction) {
  if (interaction.customId.includes("temp-popup")) {
    handlePopUp(interaction)
  }
}

module.export = {
  handleModalSelect
}
