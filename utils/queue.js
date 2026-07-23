const {supabase} = require('./supabase/supabase_client.js')

async function showQueue() {
  const { data, error } = await supabase
    .from("rbx_queue")
    .select("*, buyer_channel::text, seller_channels")
    .order("date_created", { ascending: true });

  if (error) {
    throw new Error(`Something went wrong ${error.message}`);
  }
  let string = "# QUEUE\n";
  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    let amount = entry.amount;
    let amount_string = `${amount.toLocaleString()}`;
    for (const pending of entry.pendings) {
      amount_string += `-${pending.toLocaleString()}`;
      amount -= pending;
    }
    if (entry.pendings.length > 0) {
      amount_string += `=${amount.toLocaleString()}`
    }
    let channel_string = "";
    for (const channel of entry.seller_channels) {
      channel_string += `<#${channel}> `
    }
    string += `${i + 1}: <#${entry.buyer_channel}> \`${entry.gfsinfo}\` ${amount_string} ${channel_string}\n`;
  }
  return string
}

async function getQueue() {
  const { data, error } = await supabase
    .from("rbx_queue")
    .select("*, buyer_channel::text, user_id::text")

  if (error) { throw new Error(error.message) }

  return data
}

async function getEntries(user_id) {
  const { data, error } = await supabase
    .from("rbx_queue")
    .select("*, buyer_channel::text, user_id::text")
    .eq('user_id', user_id)

  if (error) { throw new Error(error.message) }

  return data
}

async function addToQueue(userId, info, channelId, balance, id = null, date = null) {
  let payload = {
    user_id: userId,
    buyer_channel: channelId,
    date_created: new Date().toISOString(),
    amount: balance,
    gfsinfo: info,
  }
  if (id) {
    payload.id = id
  }
  if (date) {
    payload.date_created = date
  }
  const { data: response, error: errorResponse } = await supabase
    .from("rbx_queue")
    .upsert(payload, {
      onConflict: 'id'
    })
    .select()
    .single();

  if (errorResponse) {
    throw new Error(`An error occured ${errorResponse.message}`);
  }

  return response.data;
}

async function postPending(order) {
  const { data, error } = await supabase
    .from("rbx_queue")
    .upsert(order)
    .select()
  if (error) {
    throw new Error(`An error occured ${error.message}`)
  }

  return data
}

module.exports = {
  showQueue,
  getQueue,
  getEntries,
  addToQueue,
  postPending
};
