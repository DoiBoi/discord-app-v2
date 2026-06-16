const { supabase } = require('./supabase/supabase_client.js');

async function getExchanges() {
    const { data, error } = await supabase
        .from('temp_exchanges')
        .select('*')
    
    if (error) return console.error("An error occured", error.message)
    const ret = {}

    data.forEach(item => {
        if (!(item["currency"] in ret)) {
            ret[item["currency"]] = [item]
        } else {
            ret[item["currency"]].push(item)
        }
    });

    return ret
}

async function updateExchange(item) {
    const { data, error } = await supabase
        .from('temp_exchanges')
        .upsert(item)

    if (error) return console.error("An error occured", error.message)

    return
}

module.exports = {
    getExchanges,
    updateExchange
}