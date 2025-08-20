const { SlashCommandBuilder, InteractionContextType, EmbedBuilder } = require('discord.js');
const { getUserHistory } = require("../../utils/history.js");
const { if_exist } = require("../../utils/supabase/supabase_client.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gethist')
        .setDescription('Get user\' balance history')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to do a lookup on')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('currency')
                .setDescription('The currency to do a lookup on (optional)')
                .addChoices(
                    { name: "RBX", value: 'rbx' },
                    { name: "USD", value: 'usd' }
                )
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            const user = interaction.options.getUser('user');
            const currency = interaction.options.getString('currency');

            if (await !if_exist(user)) {
                await interaction.reply({ content: 'No user was found', ephemeral: true });
                return;
            }

            let embed = null

            // TODO implement buttons
            // if (currency) {
            const hist = await getUserHistory(user.id, currency)
            if (hist.length < 1) {
                await interaction.reply({ content: 'No history was found of this user', ephemeral: true})
                return;
            }
            embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('User History')
                .setDescription(`Here is the history of ${user.username}'s ${currency.toUpperCase()} balance`)
                .addFields(hist.map((hist_entry) => ({
                    name: hist_entry.timestamp,
                    value: hist_entry.amount
                })))
            // }
            await interaction.reply({ embeds: [embed] })
        } catch (error) {
            throw new Error(`There was an error running command gethist: ${error}`)
            await interaction.reply({ content: 'There was an error running this command', ephemeral: true })
        }
    }
}