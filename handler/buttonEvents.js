const {
  handlePendingYes,
  handlePendingNo,
  handlePendingChange,
  handlePageIncrement,
  handlePageDecrement,
  handleLastPage,
  handleFirstPage,
} = require("../events/rbx-queue");
const {
  handlePaymentCancel,
  handlePaymentPaid,
} = require("../events/temp-events");
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
    if (interaction.customId.includes("c-right")) {
      await handlePageIncrement(interaction);
      return;
    }
    if (interaction.customId.includes("c-left")) {
      await handlePageDecrement(interaction);
      return;
    }
    if (interaction.customId == "c-fpage") {
      await handleFirstPage(interaction);
      return;
    }
    if (interaction.customId.includes("c-lpage")) {
      await handleLastPage(interaction);
      return;
    }
    return;
  }
  if (interaction.customId.includes("tcancel")) {
    await handlePaymentCancel(interaction);
    return;
  }
  if (interaction.customId.includes("tpaid")) {
    await handlePaymentPaid(interaction);
    return;
  }
}

module.exports = {
  handleButtonInput,
};
