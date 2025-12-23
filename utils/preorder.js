const { supabase } = require('./supabase/supabase_client.js')

async function addUserPreOrder(from, info) {
    const { data: get_data, error: get_error } = await supabase
        .from("balances")
        .select("info")
        .eq("id", from)

    let json = {}
    if (get_data[0].info) {
        json = get_data[0].info
    }
    json.preorder_info = info

    const { data, error } = await supabase
        .from("balances")
        .update({ info: json, is_preorder: true })
        .eq("id", from)

    if (error) {
        throw new Error("An error occured!" + error)
    }
    return data;
}

async function createPreOrder(from, to_info, amount) {
    const { data: to_data, error: to_error } = await supabase
        .from("balances")
        .select('id', "from_preorder")
        .eq("info->preorder_info", to_info)
    
    if(!to_data[0]) {
        throw new Error("No user found!")
    } else if (to_error) {
        throw new Error("An error occured")
    }

    let to_user = to_data[0].id;

    let update_preorder = [...to_data[0].from_preorder, {from, amount}]

    const { data: update_data, error: update_error } = await supabase
        .from('balances')
        .update({ from_preorder: update_preorder })
        .eq('id', to_user)
        .select()

    return update_data;
}

async function completePreOrder(from, to_info) {
    return;
}

async function deletePreOrder(from, to_info) {
    return;
}

module.exports = { 
    addUserPreOrder
    setPreOrder
    completePreOrder
    deletePreOrder
}