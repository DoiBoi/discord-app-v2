const { ids } = require("./config");
const { supabase } = require("./supabase/supabase_client");

const TABLE = ids.ugc

async function addItems(items) {
  const { data, error } = await supabase.from(TABLE)
    .insert(items)
    .select()

  if (error) {
    throw new Error(`An error occured ${error.message}`)
  }

  return data
}


async function removeItems() {
  return
}

async function editItems() {
  return
}

async function getItem() {
  return
}

async function getItems() {
  return
}

module.exports = {
  addItems,
  removeItems,
  editItems,
  getItem,
  getItems
}
