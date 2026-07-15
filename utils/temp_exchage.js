const { supabase } = require("./supabase/supabase_client.js");

async function getExchanges() {
  const { data, error } = await supabase.from("temp_exchanges").select("*");

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
    .from("temp_exchanges")
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

  item["info"] = get_data[0]["info"]["pay_info"] ?? "";
  item["amount"] = Math.round(item["amount"] * 100) / 100;
  const { data, error } = await supabase.from("temp_exchanges").upsert(item);

  if (error) return console.error("An error occured", error.message);

  return;
}

async function finalizeTemp(id, input) {
  const num_id = Number(id)
  const num_input = Number(input)

  const { data: old_data, error: old_error} = await supabase
    .from("temp_exchanges")
    .select("pending, amount, user_id::text")
    .eq("id", num_id)

  if (old_error) return console.error(old_error.message)

  const new_amt = Math.round((old_data[0]["amount"] - input) * 100)/100
  const new_pend = Math.round((old_data[0]["pending"] - input) * 100)/100

  if (new_amt == 0.00) {
    const { data: delete_data, error: delete_error} = await supabase
      .from("temp_exchanges")
      .delete()
      .eq("id", num_id)
  } else {
    const { data, error } = await supabase
      .from("temp_exchanges")
      .update({
        pending: new_pend,
        amount: new_amt
      })
      .eq("id", num_id)
  }

  return String(old_data[0]["user_id"])
}

async function addToPending(id, input) {
  const num_id = Number(id);

  const { data: old_data, error: old_error } = await supabase
    .from("temp_exchanges")
    .select("pending")
    .eq("id", num_id);

  if (old_error) return console.error(old_error.message);

  let new_val = old_data[0]["pending"] ?? 0;
  new_val += input;

  const { data: new_data, error: new_error } = await supabase
    .from("temp_exchanges")
    .update({
      pending: new_val,
    })
    .eq("id", num_id);

  return;
}

async function setSelectChannel(id, interaction, amount, prevMessage, prevChannel) {
  // TODO
  return
}

async function getProgress(messageId, channelId) {
  // TODO
  return
}

async function setTOS(id, interaction, prevMessage, prevChannel) {
  // TODO
  return
}

module.exports = {
  getExchanges,
  getExchange,
  updateExchange,
  addToPending,
  finalizeTemp,
  setSelectChannel,
  getProgress,
  getProgress
};
