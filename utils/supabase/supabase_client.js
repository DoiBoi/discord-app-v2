const createClient = require('@supabase/supabase-js').createClient;

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function if_exist(userId) {
    const cleanedID = String(userId).match(/\d+/gm)
    const { data, error } = await supabase
        .from('balances')
        .select('id')
        .eq('id', cleanedID)
    if (error) {
        throw new Error(`There was an error if_exist ${error.message}`)
    }

    return (data != null && data?.length >= 1)
}

async function auth(userId) {
    const { data, error } = await supabase
        .from('admins')
        .select('id')
        .eq('id', userId)
    if (error) {
        throw new Error(`There was an error ${error.message}`)
    }
    if (!data || data.length === 0) {
        return false
    }
    return true
} 

module.exports = { 
    if_exist,
    auth,
    supabase 
}
