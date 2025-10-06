const { supabase } = require('./supabase/supabase_client.js')

async function getWallet(w_name) {
    const { data, error } = await supabase
        .from('wallets')
        .select('wallet')
        .eq("name", w_name)
    if (error) throw new Error(`An error occured ${error.message}`)
    return data[0]
}

module.exports = {
    getWallet
}