const { SlashCommandBuilder, InteractionContextType, EmbedBuilder } = require('discord.js');
const { getPaginatedBalances } = require('../../utils/balance.js');
const { execute } = require('./getbal.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listbals')
        .setDescription('Lists user balances with pagination')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const search = await getPaginatedBalances(1);
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('User Balances')
            .setDescription('Here are the user balances:')
            .addFields(search.map((user) => ({
                name: '',
                value: `<@${user.id}> | **USD**: $${user.balance_usd.toFixed(2)} | **RBX**: ${user.balance_rbx}`,
            })));
        await interaction.reply({ embeds: [embed] });
    }
}