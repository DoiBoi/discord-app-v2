const {supabase} = require('./supabase/supabase_client.js')

async function setGfs(userId, gfs_bool, info = null) {
    const { data: get_data, error: get_error } = await supabase
        .from('balances')
        .select('info')
        .eq('id', userId)


    let json = {}
    if (get_data[0].info) {
        json = get_data[0].info
    }

    if (!gfs_bool || json.gfs_info == null) {
        json.gfs_info = info
    }

    const { data, error } = await supabase
        .from('balances')
        .update({ is_gfs: gfs_bool, info: json })
        .eq('id', userId)
        .select()

  if (error) {
        throw new Error(`There was an error running this ${error.message}`)
    }

    return data;
}

async function addToQueue(userId, info, channelId, balance) {
  const { data: getData, error: getError } = await supabase
    .from('rbx_queue')
    .select()
    .eq('user_id', userId)
    .single()

  const { data: response, error: errorResponse } = await supabase
    .from('rbx_queue')
    .upsert({
      id: getData.id ?? null,
      buyer_channel: channelId,
      date_created: new Date().toISOString(),

    })



}

module.exports = {
    setGfs
}
