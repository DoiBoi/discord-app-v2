const { supabase } = require("./supabase/supabase_client.js");

async function getId(name) {
  const { data, error } = await supabase
    .from("ids")
    .select("item_id::text", "name")
    .eq("name", name);
  if (error) {
    console.error("Error fetching id", error);
    return [];
  }

  return data[0] ? data[0]["item_id"] : "";
}

async function upsertId(name, id) {
  const { data: get_data, error: get_error } = await supabase
    .from("ids")
    .select("id", "name")
    .eq("name", name);

  if (get_error) console.error("error fetching names", error.message);

  const payload = {
    name: name,
    item_id: id,
  };

  if (get_data[0]) {
    payload.id = get_data[0]["id"];
  }
  const { data, error } = await supabase.from("ids").upsert(payload).select();

  if (error) console.error("An error occured", error.message);

  return data[0]["item_id"];
}

module.exports = {
  getId,
  upsertId,
};
