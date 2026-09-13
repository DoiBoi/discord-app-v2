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
    .order("date", { referencedTable: TABLE, ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function removeItems() {
  return;
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
};
