const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
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

async function getPaginatedBalances(page, perPage=10, is_gfs = false) {
    let data, error;
    if (is_gfs) {
        ({ data, error } = await supabase
            .from('balances')
            .select('id::text, balance_usd, balance_rbx, is_gfs')
            .eq('is_gfs', true)
            .order('balance_usd', { ascending: false }));
    } else {
        ({ data, error } = await supabase
            .from('balances')
            .select('id::text, balance_usd, balance_rbx')
            .order('balance_usd', { ascending: false })
            .range((page - 1) * perPage, page * perPage - 1));
    }


    let { count: countdata, error: countError } = await supabase
        .from('balances')
        .select('*', { count: 'exact', head: true});

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