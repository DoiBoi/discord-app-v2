const createClient = require('@supabase/supabase-js').createClient;

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function if_exist(userId) {
    const { data, error } = supabase
        .from('balances')
        .select('id')
        .eq('id', userId)
    if (error) {
        throw new Error(`There was an error if_exist ${error}`)
    }

    return (data != null && data?.length >= 1)
}

module.exports = { 
    if_exist,
    supabase 
}
