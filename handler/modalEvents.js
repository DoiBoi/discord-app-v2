const { handleEntriesAdd } = require("../events/ugc-events")
const { auth } = require("../utils/supabase/supabase_client")

async function handleModalFunction(interaction) {
  if (await auth(interaction.user.id)) {
    if (interaction.customId == "add-entry") {
      return await handleEntriesAdd(interaction)
    }
  }
}

module.exports = {
  handleModalFunction
}
