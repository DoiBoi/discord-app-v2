const { MessageFlags } = require("discord.js");
const { editBalance, getUserInfo } = require("../utils/balance");
const {
  buildSuccessContainer,
  disableButtonRow,
  updateBoard,
  parseDiscordId,
} = require("../utils/build");
const { ids } = require("../utils/config");
const { appendUserHistory } = require("../utils/history");
const { getId } = require("../utils/id");
const {
  finalizeTemp,
  getExchange,
  removeMessage,
} = require("../utils/temp_exchage");
const { supabase } = require("../utils/supabase/supabase_client");
const { EmbedBuilder } = require("discord.js");

const CONFIRM_REGEX = /\d+\.\d+|\d+/gm;
const LOG = ids.log;
const FLAGS = {
  gfs_toggle: false,
  owe_toggle: false,
  info_toggle: true,
  new_line: false,
};
const RPC = ids.rpc;
const MESSAGES_TABLE = ids.message_link;

async function handlePaymentCancel(interaction) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });
  await disableButtonRow(interaction);
  const matches = interaction.customId.match(CONFIRM_REGEX);
  const id = matches[0];
  const amount = matches[1];
  const msg_id = matches[2];
  const item = await getExchange(Number(id));
  const ok = await supabase.rpc(RPC, {
    p_id: Number(id),
    p_delta: -amount,
  });

  if (!ok.data) {
    return await interaction.editReply({
      content: "Reject Failed",
      flags: MessageFlags.Ephemeral,
    });
  }
  await interaction.editReply({
    // embeds: [new EmbedBuilder().setDescription("Cancelled Transaction")],
    content: "Successfully rejected",
  });
  await updateBoard(interaction);
  try {
    const removed_message = await removeMessage(String(msg_id));
    console.log(removed_message)
    const [f_gid, f_cid, f_mid] = parseDiscordId(
      removed_message.forwardedMessage,
    );
    const cancelEmbed = new EmbedBuilder().setAuthor({
      name: "Exchange Cancelled",
      iconURL:
        "https://cdn.discordapp.com/emojis/950076641667846224.webp?size=128",
    });
    await interaction.channel.send({
      embeds: [cancelEmbed],
    });
    const forward_channel = await interaction.client.channels.fetch(
      String(item["channel"]),
    );
    const forward_message = await forward_channel.messages.fetch(String(f_mid));
    await forward_message.reply({
      content: `<@${item.user_id}> Mal reviewed the \$${amount} payment you received and determined that the proof provided is insufficient. To ensure full security, **please refund the \$${amount} payment**. A new payment will be issued to you by another sender once refunded.\n\nYour balance will remain at \$${(item["amount"] - item["pending"] + Number(amount)).toFixed(2)} afterwards`,
    });
  } catch (error) {
    console.error(error);
  }
}

async function handlePaymentPaid(interaction) {
  await disableButtonRow(interaction);
  await interaction.deferReply();
  const matches = interaction.customId.match(CONFIRM_REGEX);
  const id = matches[0];
  const amount = matches[1];
  const msg_id = matches[2];
  const item = await getExchange(Number(id));
  const user_id = await finalizeTemp(id, amount);
  [result, oldBalanceRbx, oldBalanceUsd] = await editBalance(
    user_id,
    [],
    [-Number(amount)],
  );
  const user = await interaction.client.users.fetch(user_id);
  await appendUserHistory(user_id, "usd", [-Number(amount)]);
  try {
    const removed_channel = await removeMessage(String(msg_id));
    const forward_channel = await interaction.client.channels.fetch(
      String(item["channel"]),
    );
    await forward_channel.send({
      content: `**New Balance:** \$${result.balance_usd.toFixed(2)} USD, \$${result.balance_rbx.toFixed(2)} RBX\n-# :red_circle: Subtracted \$${Number(amount).toFixed(2)} from ${user ? user.username : ""}'s balance\n||-# (**Previous balance:** \$${oldBalanceUsd} USD${getUserInfo(result.info, FLAGS) !== "" ? `, ${getUserInfo(result.info, FLAGS)}` : ""})||`,
    });
    const logging = await getId(LOG);
    const channel = await interaction.client.channels.fetch(String(logging));
    await channel.send({
      embeds: [buildSuccessContainer(item, amount)],
    });
  } catch (error) {
    console.error(error);
  }
  await updateBoard(interaction);
  await interaction.editReply({
    content: "Payment Sent",
  });
}

module.exports = {
  handlePaymentCancel,
  handlePaymentPaid,
};
