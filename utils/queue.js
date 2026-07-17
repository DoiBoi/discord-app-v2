async function showQueue() {
  const { data, error } = await supabase
    .from("rbx_queue")
    .select("*, buyer_channel::text, seller_channels::text")
    .order("date_created", { ascending: true });

  if (error) {
    throw new Error(`Something went wrong ${error}`);
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
    string += `${i + 1}: <#${entry.buyer_channel}> \`${buyer.user_id}\` ${amount_string} ${channel_string}`;
  }
}

async function addToQueue(userId, info, channelId, balance) {
  const { data: getData, error: getError } = await supabase
    .from("rbx_queue")
    .select()
    .eq("user_id", userId)
    .single();

  const { data: response, error: errorResponse } = await supabase
    .from("rbx_queue")
    .upsert({
      id: getData.id ?? null,
      buyer_channel: channelId,
      date_created: new Date().toISOString(),
      amount: balance,
      gfsinfo: info,
    })
    .select()
    .single();

  if (errorResponse) {
    throw new Error(`An error occured ${error.message}`);
  }

  return response.data;
}

module.exports = {
  showQueue,
  addToQueue,
};
