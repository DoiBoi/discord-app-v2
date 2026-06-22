const { supabase } = require('./supabase/supabase_client.js');

async function getExchanges() {
    const { data, error } = await supabase
        .from('temp_exchanges')
        .select('*')

    if (error) return console.error("An error occured", error.message)
    const ret = {}

    data.forEach(item => {
        if (!(item["currency"] in ret)) {
            ret[item["currency"]] = [item]
        } else {
            ret[item["currency"]].push(item)
        }
    });

    return ret
}

async function getExchange(id) {
    const { data, error } = await supabase
        .from('temp_exchanges')
        .select()
        .eq('id', id)

    if (error) return console.error("an error occured", error.message)

    return data[0]
}

async function updateExchange(item) {
    const { data, error } = await supabase
        .from('temp_exchanges')
        .upsert(item)

    if (error) return console.error("An error occured", error.message)

    return
}

async function addToPending(id, input) {
    const num_id = Number(id)

    const { data: old_data, error: old_error } = await supabase
        .from('temp_exchanges')
        .select('pending')
        .eq('id', num_id)

    if (old_error) return console.error(old_error.message)

    let new_val = old_data[0]["pending"] ?? 0
    new_val += input;

    console.log(new_val)

    const { data: new_data, error: new_error } = await supabase
        .from('temp_exchanges')
        .update({
            pending: new_val 
        })
        .eq('id', num_id)

    return
}

module.exports = {
    getExchanges,
    getExchange,
    updateExchange,
    addToPending
}