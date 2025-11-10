const { supabase } = require('./supabase/supabase_client.js');

async function setPay(userId, info = null) {
    const { data, error } = await supabase
        .from('balances')
        .update({ info: info ? info : null })
        .eq('id', userId)
        .select()
    
    if (error) {
        throw new Error(`There was an error running this ${error.message}`)
    }

    return data;
}

module.exports = {
    setPay
}