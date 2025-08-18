const {supabase} = require('./supabase/supabase_client.js')

async function getAccounts(userId) {
    const { data, error } = await supabase
        .from('balances')
        .select('accounts_rbx')
        .eq('id', userId)
        .single();

    if (error) {
        console.log(`Error fetching account for user ID ${userId}: ${error.message}`);
        return null;
    }
    return data.accounts_rbx;
}

async function appendAccount(userId, newAccount) {
    const { data, error } = await supabase
        .from('balances')
        .select('accounts_rbx')
        .eq('id', userId)

    if (error) {
        console.log(`Error fetching accounts for user ID ${userId}: ${error.message}`);
        return null;
    }

    let updatedAccounts = [];

    if (!data || data.length === 0 || !data[0]?.accounts_rbx) {
        updatedAccounts = [newAccount];
    } else {
        updatedAccounts = [...data[0]?.accounts_rbx, newAccount];
    }

    const { data: updatedData, error: updateError } = await supabase
        .from('balances')
        .upsert({ id: userId, accounts_rbx: updatedAccounts })
        .select();

    if (updateError) {
        console.log(`Error updating accounts for user ID ${userId}: ${updateError.message}`);
        return null;
    }

    return updatedData[0]?.accounts_rbx;
}

async function removeAccount(userId, accountToRemove) {
    const { data, error } = await supabase
        .from('balances')
        .select('accounts_rbx')
        .eq('id', userId)

    if (error) {
        console.log(`Error fetching accounts for user ID ${userId}: ${error.message}`);
        return null;
    }

    const updatedAccounts = data[0]?.accounts_rbx.filter(account => account !== accountToRemove);

    const { data: updatedData, error: updateError } = await supabase
        .from('balances')
        .upsert({ id: userId, accounts_rbx: updatedAccounts })
        .select();

    if (updateError) {
        console.log(`Error updating accounts for user ID ${userId}: ${updateError.message}`);
        return null;
    }

    return updatedData[0]?.accounts_rbx;
}

module.exports = {
    getAccounts,
    appendAccount,
    removeAccount
}