const { getBalances } = require("./balance.js");
const { ids } = require("./config.js");
const { supabase } = require("./supabase/supabase_client.js");

const TABLE = ids.queue;
const PENDING_TABLE = ids.pending;
const CASHOUT_RPC = ids.cashout_rpc;
async function showQueue(matches = []) {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`*, ${PENDING_TABLE} ( * )`)
    .order("date_created", { ascending: true });

  if (error) {
    throw new Error(`Something went wrong ${error.message}`);
  }
  let string = "# QUEUE\n";

  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    let amount = entry.amount;
    let amount_string = `${amount.toLocaleString()}`;
    let channel_string = "";
    entry[PENDING_TABLE] = entry[PENDING_TABLE].filter((item) => {
      return !matches.includes(String(item.id))
    })
    for (const pending of entry[PENDING_TABLE]) {
      amount_string += `-${pending.amount.toLocaleString()}`;
      amount -= pending.amount;
    }
    if (entry[PENDING_TABLE].length > 0) {
      amount_string += `=${amount.toLocaleString()}`;
    }
    for (const pending of entry[PENDING_TABLE]) {
      channel_string += `<#${pending.channel}> `;
    }
    string += `${i + 1}: <#${entry.buyer_channel}> \`${entry.gfsinfo}\` ${amount_string} ${channel_string}\n`;
  }
  return string;
}

async function getQueue() {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`*, buyer_channel, user_id::text, ${PENDING_TABLE} (*)`)
    .order("date_created", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getEntry(user_id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`*, user_id::text, ${PENDING_TABLE} ( * )`)
    .eq("user_id", user_id);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function addToQueue(
  userId,
  info,
  channelId,
  balance,
  id = null,
  date = null,
) {
  let payload = {
    user_id: userId,
    buyer_channel: channelId,
    date_created: new Date().toISOString(),
    amount: balance,
    gfsinfo: info,
  };
  if (id) {
    payload.id = id;
  }
  if (date) {
    payload.date_created = date;
  }
  const { data: response, error: errorResponse } = await supabase
    .from(TABLE)
    .upsert(payload, {
      onConflict: "id",
    })
    .select()
    .single();

  if (errorResponse) {
    throw new Error(`An error occured ${errorResponse.message}`);
  }

  return response.data;
}

async function deletePendings(ids) {
  const { data, error } = await supabase
    .from(PENDING_TABLE)
    .delete()
    .in("id", ids);

  if (error) {
    throw new Error("an error occured in deletePendings" + error.message);
  }

  return data;
}

async function postPending(order) {
  const formatted_order = order.map((item) => {
    return {
      queue_id: item.id,
      amount: item.amount,
      channel: item.channel,
    };
  });
  const { data, error } = await supabase
    .from(PENDING_TABLE)
    .upsert(formatted_order)
    .select();
  if (error) {
    throw new Error(`An error occured ${error.message}`);
  }

  return data;
}

async function getEntries(ids) {
  const { data, error } = await supabase
    .from(PENDING_TABLE)
    .select("*, queue_id (*)")
    .in("id", ids);

  if (error) {
    throw new Error(`An error occured ${error.message}`);
  }

  return data;
}

async function finalizeCashout(items) {
  const { data, error } = await supabase.rpc(CASHOUT_RPC, {
    pending_ids: items.map((item) => {
      return item.id;
    }),
  });
  if (error) {
    throw new Error(error.message);
  }
  const balances = await getBalances(
    data.map((item) => {
      return item.balance_id;
    }),
  );
  return data;
}

module.exports = {
  showQueue,
  getQueue,
  getEntry,
  addToQueue,
  postPending,
  getEntries,
  finalizeCashout,
  deletePendings,
};
