const { supabase } = require('./supabase/supabase_client.js')

async function getUserHistory(userId, currency) {
    const { data, error } = await supabase
        .from('balances')
        .select(`history_${currency}`)
        .eq('id', userId)

    if (error) {
        console.error('Error fetching user history:', error)
        return []
    }

    return data[0]?.[`history_${currency}`] || []
}

async function appendUserHistory(userId, currency, amount) {
    const { data, error } = await supabase
        .from('balances')
        .select(`history_${currency}`)
        .eq('id', userId)
    
    if (error) {
        throw new Error(`Error fetching user history: ${error.message}`)
    }

    let  history = data[0]?.[`history_${currency}`] || []

    const new_history_arr = amount.map((value) => ({
        amount: value,
        timestamp: new Date().toISOString()
    }))

    if (history) {
        history = [...history, ...new_history_arr]
    } else {
        history = new_history_arr
    }

    const { data: updateData, error: updateError } = await supabase
        .from('balances')
        .upsert({ id: userId, [`history_${currency}`]: history })
        .select()
    if (updateError) {
        throw new Error(`Error updating user history: ${updateError.message}`)
    }
    return updateData[0]
}

module.exports = {
    getUserHistory,
    appendUserHistory
}