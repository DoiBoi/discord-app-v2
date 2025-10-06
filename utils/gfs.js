const {supabase} = require('./supabase/supabase_client.js')

async function setGfs(userId, gfs_bool) {
    const { data, error } = await supabase
        .from('balances')
        .update({ is_gfs: gfs_bool })
        .eq('id', userId)
        .select()
    
    if (error) {
        throw new Error(`There was an error running this ${error.message}`)
    }
    
    return data;
}

module.exports = {
    setGfs
}