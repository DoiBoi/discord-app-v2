const {supabase} = require('./supabase/supabase_client.js')

async function setOwe(userId, owe_bool) {
    const { data, error } = await supabase
        .from('balances')
        .update({ is_owe: owe_bool })
        .eq('id', userId)
        .select()
    
    if (error) {
        throw new Error(`There was an error running this ${error.message}`)
    }
    
    return data;
}

module.exports = {
    setOwe
}