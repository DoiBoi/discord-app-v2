const { ids } = require("./config");
const { supabase } = require("./supabase/supabase_client");

const TABLE = ids.ugc_queue;
const GROUPS = ids.groups;

async function addItems(items) {
  const { data, error } = await supabase.from(TABLE).insert(items).select();

  if (error) {
    throw new Error(`An error occured ${error.message}`);
  }

  return data;
}

async function fetchGroups() {
  const { data, error } = await supabase
    .from(GROUPS)
    .select(`*, ${TABLE} (*)`)
    .order("order", { ascending: true })
    .order("channel_id", { referencedTable: TABLE, ascending: true })
    .order("date", { referencedTable: TABLE, ascending: false })
    .order("username", { referencedTable: TABLE, ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function removeItems(params = null) {
  if (!params) {
    throw new Error("Need to supply params at removeitems");
  }
  let client = supabase.from(TABLE).delete();
  if (params.id) {
    client = client.eq("id", params.id);
  } else if (params.channel) {
    client = client.eq("channel_id", params.channel);
  } else if (params.ids) {
    client = client.in("id", params.ids);
  }
  const { data, error } = await client.select();
  if (error) {
    throw new Error("An error occured " + error.message);
  }
  return data;
}

async function editItems(payload) {
  const { id: id, ...entry } = payload;
  const { data, error } = await supabase
    .from(TABLE)
    .update(entry)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error("An error occured!", error.message);
  }

  return data;
}

async function toggleLogged(ids) {
  const { data: getData, error: getError } = await supabase
    .from(TABLE)
    .select("*")
    .in("id", ids);

  if (getError) {
    throw new Error(getError.message);
  }

  const payload = getData.map((item) => {
    return {
      ...item,
      log: !item.log,
    };
  });
  const { data, error } = await supabase.from(TABLE).upsert(payload).select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getItemByChannel(channelId) {
  const { data, error } = await supabase
    .from(GROUPS)
    .select(`*, ${TABLE} (*)`)
    .eq(`${TABLE}.channel_id`, channelId)
    .order("order", { ascending: true });

  if (error) {
    throw new Error("An error occured", error.message);
  }

  return data.filter((item) => item[TABLE].length > 0);
}

async function getItems() {
  const data = (await fetchGroups()).map((item) => item[TABLE]);
  return data.flat();
}

async function fetchItems() {
  const { data, error } = await supabase.from(TABLE).select(`*, ${GROUPS} (*)`);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function assignGroups(entries) {
  const payload = entries
    .map((item) => {
      return item.ids.map((entry) => {
        return {
          ...entry,
          group: item.group,
        };
      });
    })
    .flat();

  const { data, error } = await supabase.from(TABLE).upsert(payload).select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function editStock(entries) {
  const payload = entries.map((item) => {
    const { [TABLE]: _, ...group } = item.group;
    return {
      ...group,
      amount: item.amount,
    };
  });
  const { data, error } = await supabase.from(GROUPS).upsert(payload).select();
  if (error) {
    throw new Error("An error occured " + error.message);
  }

  return data;
}

async function subtractEntries(entries, reminder_message = "") {
  const payload = entries.map((item) => {
    return {
      ...item.entry,
      amount: item.entry.amount - item.amount,
      reminder_message,
    };
  });

  const { data, error } = await supabase.from(TABLE).upsert(payload).select();

  const groupSubtraction = entries.reduce((acc, curr) => {
    if (!(curr.entry.group in acc)) {
      acc[curr.entry.group] = curr.amount;
    } else {
      acc[curr.entry.group] += amount;
    }
    return acc;
  }, {});

  if (error) {
    throw new Error(error.message);
  }
  const groupPayload = (await fetchGroups()).map((item) => {
    const { [TABLE]: _, ...group } = item;
    return {
      ...group,
      amount: group.amount - (groupSubtraction[group.id] ?? 0),
    };
  });

  const { data: _, error: payError } = await supabase
    .from(GROUPS)
    .upsert(groupPayload);
  if (payError) {
    throw new Error(payError.message);
  }

  return data;
}

module.exports = {
  addItems,
  removeItems,
  editItems,
  getItems,
  fetchGroups,
  fetchItems,
  getItemByChannel,
  toggleLogged,
  assignGroups,
  editStock,
  subtractEntries,
};
