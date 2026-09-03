const { appendUserHistory } = require("../utils/history");
const { finalizeTemp } = require("../utils/temp_exchage");

const CONFIRM_REGEX = /\d+\.\d+|\d+/gm;

async function handlePaymentCancel(interaction) {
  const matches = interaction.customId.match(CONFIRM_REGEX);
  const id = matches[0];
  const amount = matches[1];
  const user_id = await finalizeTemp(id, amount);
  const calculatedAmount = item["amount"] - item["pending"];
  const amountMinusFee = (calculatedAmount * (100 - item["fee"])) / 100;
  [result, oldBalanceRbx, oldBalanceUsd] = await editBalance(
    user_id,
    [],
    [-Number(amount)],
  );
  const user = await client.users.fetch(user_id);
  await appendUserHistory(user_id, "usd", [-Number(amount)]);
  try {
    const forward_channel = await interaction.client.channels.fetch(
      String(item["channel"]),
    );
    await forward_channel.send({
      content: `**New Balance:** \$${result.balance_usd.toFixed(2)} USD, \$${result.balance_rbx.toFixed(2)} RBX\n-# :red_circle: Subtracted \$${Number(amount).toFixed(2)} from ${user ? user.username : ""}'s balance\n||-# (**Previous balance:** \$${oldBalanceUsd} USD${getUserInfo(result.info, FLAGS) !== "" ? `, ${getUserInfo(result.info, FLAGS)}` : ""})||`,
    });
  } catch {}
}

async function handlePaymentPaid(interaction) {
  const matches = interaction.customId.match(CONFIRM_REGEX);
  const id = matches[0];
  const amount = matches[1];
}

module.exports = {
  handlePaymentCancel,
  handlePaymentPaid,
};
