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
    .order("order", {ascending: true})
    .order("channel_id", { referencedTable: TABLE, ascending: true})
    .order("date", {referencedTable: TABLE, ascending: false});

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function removeItems() {
  return;
}

async function editItems() {
  return;
}

async function getItem() {
  return;
}

async function getItems() {
  return;
}

async function fetchItems() {
  const { data, error } = await supabase.from(TABLE).select(`*, ${GROUPS} (*)`);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

module.exports = {
  addItems,
  removeItems,
  editItems,
  getItem,
  getItems,
  fetchGroups,
  fetchItems,
};
