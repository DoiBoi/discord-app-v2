const { supabase } = require('./supabase/supabase_client.js');

async function setPay(userId, info = null) {

    const { data: get_data, error: get_error } = await supabase
        .from('balances')
        .select('info')
    

    let json = {}
    if (get_data.info) {
        json = get_data
    }

    json.pay_info = info

    const { data, error } = await supabase
        .from('balances')
        .update({ info: json })
        .eq('id', userId)
        .select()
    
    if (error || get_error) {
        throw new Error(`There was an error running this ${error.message}`)
    }

    return data;
}

module.exports = {
    setPay
}