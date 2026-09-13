const { handleEntriesAdd, handleAssignGroup, handleStockGroup, handlePayUGC } = require("../events/ugc-events")
const { auth } = require("../utils/supabase/supabase_client")

async function handleModalFunction(interaction) {
  if (await auth(interaction.user.id)) {
    if (interaction.customId == "add-entry") {
      return await handleEntriesAdd(interaction)
    }
    if (interaction.customId == "group-ugc") {
      return await handleAssignGroup(interaction)
    }
    if (interaction.customId == "stock-groups") {
      return await handleStockGroup(interaction)
    }
    if (interaction.customId == "pay-ugc") {
      return await handlePayUGC(interaction)
    }
  }
}

module.exports = {
  handleModalFunction
}
