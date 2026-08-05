const { handlePendingYes, handlePendingNo, handlePendingChange } = require("../events/rbx-queue");
const { auth } = require("../utils/supabase/supabase_client");

async function handleButtonInput(interaction) {
  if (await auth(interaction.user.id)) {
    if (interaction.customId.includes("cy")) {
      await handlePendingYes(interaction);
      return;
    }
    if (interaction.customId.includes("cn")) {
      await handlePendingNo(interaction);
      return;
    }
    if (interaction.customId.includes("cc")) {
      await handlePendingChange(interaction);
      return;
    }
  }
}

module.exports = {
  handleButtonInput
}
