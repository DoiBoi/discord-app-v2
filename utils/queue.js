const { getBalances } = require("./balance.js");
const { ids } = require("./config.js");
const { supabase } = require("./supabase/supabase_client.js");

const TABLE = ids.queue;
const PENDING_TABLE = ids.pending;
const CASHOUT_RPC = ids.cashout_rpc;
const PERPAGE = 5;
async function showQueue(matches = [], page = -1) {
  let { data, error } = await supabase
    .from(TABLE)
    .select(`*, ${PENDING_TABLE} ( * )`)
    .order("date_created", { ascending: true });

  if (error) {
    throw new Error(`Something went wrong ${error.message}`);
  }

  const totalPages = Math.ceil(data.length / PERPAGE);
  if (page >= 0) {
    data = data.slice(page * PERPAGE, (page + 1) * PERPAGE);
  }

  let string = "# QUEUE\n";

  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    let amount = entry.amount;
    let amount_string = `${amount.toLocaleString()}`;
    let channel_string = "";
    entry[PENDING_TABLE] = entry[PENDING_TABLE].filter((item) => {
      return !matches.includes(String(item.id));
    });
    for (const pending of entry[PENDING_TABLE]) {
      amount_string += `-[${pending.amount.toLocaleString()}](${pending.channel})`;
      amount -= pending.amount;
    }
    if (entry[PENDING_TABLE].length > 0) {
      amount_string += `=${amount.toLocaleString()}`;
    }
    for (const pending of entry[PENDING_TABLE]) {
      channel_string += `${pending.channel_name !== "" ? pending.channel_name : ""} `;
    }
    string += `${page >= 0 ? i + 1 + page * PERPAGE : i + 1}. ${entry.channel_name !== "" ? `[${entry.channel_name}](${entry.channel_url})` : `<#${entry.buyer_channel}>`} \`${entry.gfsinfo}\` ${amount_string} ${channel_string}\n`;
  }
  return {
    content: string,
    maxPage: totalPages,
    page: page,
  };
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
  channel_name,
  channel_url,
  id = null,
  date = null,
) {
  let payload = {
    user_id: userId,
    buyer_channel: channelId,
    date_created: new Date().toISOString(),
    amount: balance,
    gfsinfo: info,
    channel_name: channel_name,
    channel_url: channel_url,
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

async function deleteQueue(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)
    .select(`*, ${PENDING_TABLE} (*)`)
    .single();

  if (error) throw new Error(error.message);

  return data;
}

async function postPending(order) {
  const upsert = [];
  const insert = [];

  order.forEach((item) => {
    const json = {
      queue_id: item.id,
      amount: item.amount,
      channel: item.channel,
      channel_name: item.channel_name,
    };

    if (item.pending_id) {
      json.id = item.pending_id;
      upsert.push(json);
    } else {
      insert.push(json);
    }
  });
  const { data: upsertData, error: upsertError } = await supabase
    .from(PENDING_TABLE)
    .upsert(upsert)
    .select();
  if (upsertError) {
    throw new Error(`An error occured ${upsertError.message}`);
  }

  const { data: insertData, error: insertError } = await supabase
    .from(PENDING_TABLE)
    .insert(insert)
    .select();

  if (insertError) {
    throw new Error(`An error occured ${insertError.message}`);
  }

  return [...upsertData, ...insertData];
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
  return data;
}

async function updateURL(items, url) {
  const { data: fetchData, error: fetchError } = await supabase
    .from(PENDING_TABLE)
    .select()
    .in(
      "id",
      items.map((item) => item.id),
    );

  if (fetchError) {
    throw new Error(fetchError.message);
  }
  for (const item of items) {
    const fetchItem = fetchData.find((findItem) => findItem.id === item.id);
    fetchItem.channel = url;
  }

  const { data, error } = await supabase
    .from(PENDING_TABLE)
    .upsert(fetchData)
    .select();

  if (error) {
    throw new Error(error.message);
  }

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
  updateURL,
  deleteQueue,
};
