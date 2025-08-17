const createClient = require('@supabase/supabase-js').createClient;
const { SlashCommandBuilder, InteractionContextType } = require('discord.js');

const supabaseUrl = 'https://sercxhohulnwvynvhgzf.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function getUserBalance(userId) {
    const { data, error } = await supabase
        .from('balances')
        .select()
        .eq('id', userId)
        .single();

    if (error) throw new Error(`Error fetching balance: ${error.message}`);
    return data;
}

async function editBalance(userId, balance_rbx = 0, balance_usd = 0) {
    if (!Number.isInteger(balance_rbx)) {
        throw new Error('balance_rbx must be an integer value');
    }
    
    const { data, error } = await supabase
        .from('balances')
        .select()
        .eq('id', userId)
    if (error) {
        console.log(`Error retrieving balance: ${error.message}`);
        throw new Error(`Error retrieving balance: ${error.message}`);
    };

    let newBalanceRbx = 0;
    let newBalanceUsd = 0;

    if (data.length > 0) {
        newBalanceRbx = data[0].balance_rbx + balance_rbx;
        newBalanceUsd = data[0].balance_usd + balance_usd;
    } else {
        newBalanceRbx = balance_rbx;
        newBalanceUsd = balance_usd;
    }

    const { data: updatedData, error: updateError } = await supabase
        .from('balances')
        .upsert({ id: userId, balance_usd: newBalanceUsd, balance_rbx: newBalanceRbx })
        .select();
    if (updateError) throw new Error(`Error updating balance: ${updateError.message}`);

    return updatedData[0];
}

async function clearBalance(userId) {
    const {data, error} = await supabase
        .from('balances')
        .upsert({ id: userId, balance_usd: 0, balance_rbx: 0 })
        .select();
    if (error) throw new Error(`Error clearing balance: ${error.message}`);

    return data[0];
}

// Export utility functions for use in other files
module.exports = {
    getUserBalance,
    editBalance,
    clearBalance
};