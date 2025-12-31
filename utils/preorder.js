const { supabase } = require('./supabase/supabase_client.js')
const { editBalance } = require('./balance.js')

/** Adds user to the GFS with timestamp
 *  @param { int } from the user id it is from
 *  @param { string } info the info of the from user
 *  @param { int } amount the amount of balance from the user
 *  @param { timestampz } timestamp the timestamp this has been ordered
 */ 
async function addUserGFS(from, info, amount, timestamp) {
    const { data, error } = await supabase
        .from("gfs")
        .insert({
            id: from,
            info: info,
            ordered_at: timestamp,
            balance: amount,
            from_gfs: []
        })
        .select()

    if (error) {
        throw new Error("An error occured!" + error)
    }

    await editBalance(from, [amount], [])
    return data;
}

// Creates a pending payment for from_user sent by to_user given an index
// to_user should be on the GFS table
async function createGFS(from, index, amount) {
    const { data: to_data, error: to_error } = await supabase
        .from("gfs")
        .select('id, from_gfs')
        .order('ordered_at', {ascending: true})
    
    if (to_error) {
        throw new Error("An error occured")
    }
    if (!to_data?.[index]) {
        throw new Error("No user found!")
    }

    let to_user = to_data[index].id;

    let update_gfs = [...(to_data[index].from_gfs ?? []), { user: from, amount: amount }]

    const { data: update_data, error: update_error } = await supabase
        .from('gfs')
        .update({ from_gfs: update_gfs })
        .eq('id', to_user)
        .select()

    return update_data;
}

async function setGFS(from, index, new_amount) {
    const { data: to_data, error: to_error } = await supabase
        .from("gfs")
        .select('id, from_gfs')
        .order('ordered_at', {ascending: true})
    
    if (to_error) {
        throw new Error("An error occured!")
    }
    if (!to_data?.[0]) {
        throw new Error("no user found")
    }
    if (!to_data[0].from_gfs) {
        throw new Error("no data found")
    }

    let to_user = to_data[index].id
    
    let new_data = to_data[index].from_gfs

    for (let object of new_data) {
        if (object.user === from) {
            object.amount = new_amount
        }
    }
    
    const { data: update_data, error: update_error } = await supabase
        .from('balances')
        .update({ from_gfs: new_data })
        .eq('id', to_user)
        .select()

    if (update_error) {
        throw new Error("An error occured!" + update_error)
    }

    return update_data;
}

/**
 * Completes the GFS order given from and index
 * It should retrieve the entry of that 
 * 
 * @param { int } from The user that is paying the indexed user
 * @param { int } index the index of the GFS entries sorted by ascendign date
 * @param { boolean } deleteGFS whether to simply delete that specific entry or not
 *                              in case failed transaction
 */
async function completeGFS(from, index, deleteGFS = false) {
  const { data: rows, error: fetchError } = await supabase
    .from("gfs")
    .select("id, from_gfs, balance")
    .order("ordered_at", { ascending: true });

  if (fetchError) throw new Error("An error occured!" + fetchError);
  if (!rows?.[index]) throw new Error("no user found");

  const to_user = rows[index].id;
  const currentBalance = rows[index].balance ?? 0;
  const fromList = rows[index].from_gfs ?? [];

  // Find the payer entry
  const payerEntry = fromList.find(e => e.user === from);
  if (!payerEntry) throw new Error("no matching payment entry found");

  const paidAmount = Number(payerEntry.amount) || 0;

  // Remove the payer entry from the pending list
  const new_from_gfs = fromList.filter(e => e.user !== from);

  // Compute the new gfs balance (unless you’re just deleting the entry)
  const new_balance = deleteGFS ? currentBalance : (currentBalance - paidAmount);

  let gfsResult;

  if (new_balance === 0) {
    // Remove the row from gfs table
    const { error: deleteError } = await supabase
      .from("gfs")
      .delete()
      .eq("id", to_user);

    if (deleteError) throw new Error("An error occured!" + deleteError);

    gfsResult = { deleted: true, id: to_user };
  } else {
    // Update the gfs row with new balance + new pending list
    const { data: updateData, error: updateError } = await supabase
      .from("gfs")
      .update({ balance: new_balance, from_gfs: new_from_gfs })
      .eq("id", to_user)
      .select();

    if (updateError) throw new Error("An error occured!" + updateError);

    gfsResult = updateData;
  }

  // Mirror the change into balances table
  // You added `amount` into balances when creating GFS, so completing should subtract it.
  if (!deleteGFS && paidAmount !== 0) {
    await editBalance(to_user, [-paidAmount], []);
  }

  return gfsResult;
}

module.exports = { 
    addUserGFS,
    createGFS,
    setGFS,
    completeGFS,
}