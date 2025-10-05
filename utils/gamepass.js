const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { supabase } = require('./supabase/supabase_client.js');

async function getGamePass(gamepass) {
    const { data, error } = await supabase
        .from('gamepasses')
        .select()
        .eq('name', gamepass)
    if (error) {
        throw new Error(`Error retrieving gamepass ${error.message}`);
    }

    return data[0];
}

async function listGamePasses() {
    const { data, error } = await supabase
        .from('gamepasses')
        .select("name, link, in_use")
    if (error) throw new Error(`Error retrieving gamepass ${error.message}`);
    return data
}

async function toggleInUse(gamepass) {
    const { data, error } = await supabase
        .from('gamepasses')
        .select("in_use, link")
        .eq("name", gamepass)
    if (error) throw new Error(`Error retrieving gamepass ${error.message}`);
    if (!data || data.length === 0) {
        throw new Error(`Gamepass '${gamepass}' not found`);
    }
    const in_use = data[0].in_use
    const { data: new_data, error: new_error } = await supabase
        .from('gamepasses')
        .upsert({
            name: gamepass,
            in_use: !in_use,
            link: gamepass.link
        })
        .select();
    if (new_error) throw new Error(`Error retrieving gamepass ${new_error.message}`);
    
    return new_data[0];
}

module.exports = {
    toggleInUse,
    getGamePass,
    listGamePasses
}