const { ids } = require("./config.js");
const { setPay } = require("./pay.js");
const { supabase } = require("./supabase/supabase_client.js");
const TABLE = ids.table;

async function getExchanges() {
  const { data, error } = await supabase.from(TABLE).select("*");

  if (error) return console.error("An error occured", error.message);
  const ret = {};

  data.forEach((item) => {
    if (!(item["currency"] in ret)) {
      ret[item["currency"]] = [item];
    } else {
      ret[item["currency"]].push(item);
    }
  });

  return ret;
}

async function getExchange(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*, channel::text, user_id::text")
    .eq("id", id);

  if (error) return console.error("an error occured", error.message);

  return data[0];
}

async function updateExchange(item) {
  const { data: get_data, error: get_error } = await supabase
    .from("balances")
    .select("info")
    .eq("id", item["user_id"]);

  if (get_error)
    return console.error("An error occured in get", get_error.message);

  item["info"] = get_data[0]["info"] ? get_data[0]["info"]["pay_info"] : "";
  item["amount"] = Math.round(item["amount"] * 100) / 100;
  const { data, error } = await supabase.from(TABLE).upsert(item);

  if (error) return console.error("An error occured", error.message);

  return;
}

async function finalizeTemp(id, input) {
  const num_id = Number(id);
  const num_input = Number(input);

  const { data: old_data, error: old_error } = await supabase
    .from(TABLE)
    .select("pending, amount, user_id::text")
    .eq("id", num_id);

  if (old_error) return console.error(old_error.message);

  const new_amt = Math.round((old_data[0]["amount"] - input) * 100) / 100;
  const new_pend = Math.round((old_data[0]["pending"] - input) * 100) / 100;

  if (new_amt <= 0.0) {
    const { data: delete_data, error: delete_error } = await supabase
      .from(TABLE)
      .delete()
      .eq("id", num_id);
    await setPay(old_data[0].user_id, null);
  } else {
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        pending: new_pend,
        amount: new_amt,
      })
      .eq("id", num_id);
  }

  return String(old_data[0]["user_id"]);
}

async function removeExchange(id) {
  const num_id = Number(id);
  const { data, error } = await supabase.from(TABLE).delete().eq("id", num_id);

  if (error)
    throw new Error(`An error occured in removeExchange ${error.message}`);
}

async function addToPending(id, input) {
  const num_id = Number(id);

  const { data: old_data, error: old_error } = await supabase
    .from(TABLE)
    .select("pending")
    .eq("id", num_id);

  if (old_error) return console.error(old_error.message);

  let new_val = old_data[0]["pending"] ?? 0;
  new_val += input;

  const { data: new_data, error: new_error } = await supabase
    .from(TABLE)
    .update({
      pending: new_val,
    })
    .eq("id", num_id);

  return;
}

async function addMessage(id, url, userId) {
  const { data: fetchData, error: fetchError } = await supabase
    .from(TABLE)
    .select("message_links")
    .eq("id", id)
    .single();
  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const messages = fetchData.message_links;
  messages.push({
    id: userId,
    url: url,
  });

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      message_links: [...new Set(messages)],
    })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function getAvailableTransaction() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("info, message_links, pending")
    .gt("pending", 0);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function removeMessage(id, url) {
  const { data: fetchData, error: fetchError } = await supabase
    .from(TABLE)
    .select("message_links")
    .eq("id", id);

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  let newArray = [];
  if (fetchData[0].message_links.length > 0) {
    newArray = fetchData[0].message_links.filter((item) => item.url !== url);
  }
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      message_links: newArray,
    })
    .eq("id", id);

  return;
}

module.exports = {
  getExchanges,
  getExchange,
  updateExchange,
  addToPending,
  finalizeTemp,
  removeExchange,
  removeMessage,
  addMessage,
  getAvailableTransaction,
};
