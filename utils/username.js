const {supabase} = require('./supabase/supabase_client.js')

async function getAccounts(username) {
    const { data, error } = await supabase
        .from('usernames')
        .select()
        .eq('name', username)
        .single();
    if (error) {
        console.log(`Error fetching account for user ID ${username}: ${error.message}`);
        return null;
    }
    return data?.usernames;
}

module.exports = {
    getAccounts
}