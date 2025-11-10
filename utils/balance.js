const { supabase } = require('./supabase/supabase_client.js')

async function getUserBalance(userId) {
    const { data, error } = await supabase
        .from('balances')
        .select()
        .eq('id', userId);
    if (error) throw new Error(`Error fetching balance: ${error.message}`);
    return data[0];
}

async function editBalance(userId, balance_rbx = [], balance_usd = []) {
    
    const { data, error } = await supabase
        .from('balances')
        .select()
        .eq('id', userId)
    if (error) {
        console.log(`Error retrieving balance: ${error.message}`);
        throw new Error(`Error retrieving balance: ${error.message}`);
    };


    let oldBalanceRbx = 0;
    let oldBalanceUsd = 0;

    if (data.length > 0) {
        oldBalanceRbx = data[0].balance_rbx;
        oldBalanceUsd = data[0].balance_usd;
    }

    let newBalanceRbx = oldBalanceRbx;
    let newBalanceUsd = oldBalanceUsd;

    for (const num of balance_rbx){
        if (!Number.isInteger(num)) {
            throw new Error('balance_rbx must be an integer value');
        }
        newBalanceRbx += num;
    }

    for (const num of balance_usd){
        newBalanceUsd += num;
    }

    const { data: updatedData, error: updateError } = await supabase
        .from('balances')
        .upsert({ id: userId, balance_usd: newBalanceUsd, balance_rbx: newBalanceRbx })
        .select();
    if (updateError) throw new Error(`Error updating balance: ${updateError.message}`);

    return [updatedData[0], oldBalanceRbx, oldBalanceUsd];
}

async function clearBalance(userId) {
    const {data, error} = await supabase
        .from('balances')
        .upsert({ id: userId, balance_usd: 0, balance_rbx: 0 })
        .select();
    if (error) throw new Error(`Error clearing balance: ${error.message}`);

    return data[0];
}

async function getPaginatedBalances(page, perPage=10, is_gfs = false, is_owe = false, is_info = false) {
    let data, error, countdata, countError;
    if (is_gfs) {
        ({ data, error } = await supabase
            .from('balances')
            .select('id::text, balance_usd, balance_rbx, is_gfs')
            .eq('is_gfs', true)
            .order('balance_usd', { ascending: false })
            .range((page - 1) * perPage, page * perPage - 1));
        ({ count: countdata, error: countError } = await supabase
        .from('balances')
        .select('*', { count: 'exact', head: true })
        .eq('is_gfs', true));
    } else if (is_owe) { 
        ({ data, error } = await supabase
            .from('balances')
            .select('id::text, balance_usd, balance_rbx, is_owe')
            .eq('is_owe', true)
            .order('balance_usd', {ascending: false})
            .range((page - 1) * perPage, page * perPage - 1));
        ({ count: countdata, error: countError } = await supabase
        .from('balances')
        .select('*', { count: 'exact', head: true })
        .eq('is_owe', true));
    } else if (is_info) {
        ({ data, error } = await supabase
            .from('balances')
            .select('id::text, balance_usd, balance_rbx, info')
            .not('info', 'is', null)
            .order('balance_usd', { ascending: false })
            .range((page - 1) * perPage, page * perPage - 1));
        ({ count: countdata, error: countError } = await supabase
        .from('balances')
        .select('*', { count: 'exact', head: true })
        .not('info', 'is', null));
    } else {
        ({ data, error } = await supabase
            .from('balances')
            .select('id::text, balance_usd, balance_rbx')
            .order('balance_usd', { ascending: false })
            .range((page - 1) * perPage, page * perPage - 1));
        ({ count: countdata, error: countError } = await supabase
        .from('balances')
        .select('*', { count: 'exact', head: true}));
    }
    if (error || countError) throw new Error(`Error fetching paginated balances: ${error ? error.message : countError.message}`);

    return [data, countdata];
}

// Export utility functions for use in other files
module.exports = {
    getUserBalance,
    editBalance,
    clearBalance,
    getPaginatedBalances,
};