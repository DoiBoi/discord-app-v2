const { SlashCommandBuilder,
    InteractionContextType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonStyle,
    ButtonBuilder
} = require('discord.js');
const { getUserHistory } = require("../../utils/history.js");
const { if_exist } = require("../../utils/supabase/supabase_client.js")
const ITEM_IN_PAGE = 10;
let user, currency; 

function formatDateToSeconds(date) {
    const pdtOffset = -7 * 60;
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const pdtDate = new Date(utc + (pdtOffset * 60000));

    const year = pdtDate.getFullYear();
    const month = String(pdtDate.getMonth() + 1).padStart(2, '0');
    const day = String(pdtDate.getDate()).padStart(2, '0');
    const hours = String(pdtDate.getHours()).padStart(2, '0');
    const minutes = String(pdtDate.getMinutes()).padStart(2, '0');
    const seconds = String(pdtDate.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} PDT`;
}

function buildResponse(data, currentPage, totalPages) {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('User History')
        .setDescription(`Here is the history of ${user.username}'s ${currency.toUpperCase()} balance`)
        .addFields(data.map((hist_entry) => {
            const square = hist_entry.amount > 0 ? '🟩' : hist_entry.amount < 0 ? '🟥' : '';
            return {
                name: `${square} ${hist_entry.amount.toString()}`,
                value: formatDateToSeconds(new Date(hist_entry.timestamp))
            };
        }))
        .setFooter({ text: `Page ${currentPage} of ${totalPages}` })

    const leftButton = new ButtonBuilder()
        .setCustomId('left')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('⬅️');
    if (currentPage <= 1) leftButton.setDisabled(true);

    const rightButton = new ButtonBuilder()
        .setCustomId('right')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('➡️');
    if (currentPage >= totalPages) rightButton.setDisabled(true);
    const actionRow = new ActionRowBuilder()
        .addComponents(leftButton, rightButton);

    return [embed, actionRow]
}

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
            user = interaction.options.getUser('user');
            currency = interaction.options.getString('currency');
            let currentPage = 1;

            if (await !if_exist(user)) {
                await interaction.reply({ content: 'No user was found', ephemeral: true });
                return;
            }

            let hist = await getUserHistory(user.id, currency)
            hist.reverse();

            if (hist.length < 1) {
                await interaction.reply({ content: 'No history was found of this user', ephemeral: true })
                return;
            }
            const totalPages = Math.ceil(hist.length/ITEM_IN_PAGE)
            let [embed, actionRow] = buildResponse(hist.slice(0, Math.min(hist.length, ITEM_IN_PAGE)), currentPage, totalPages);
            const response = await interaction.reply({ embeds: [embed], components: [actionRow], withResponse: true })

            const filter = i => i.user.id === interaction.user.id &&
                (i.customId === 'left' || i.customId === 'right');

            const collector = response.resource.message.createMessageComponentCollector({ filter, time: 60_000 });

            collector.on('collect', async (i) => {
                if (i.customId === 'left') {
                    currentPage--;
                } else if (i.customId === 'right') {
                    currentPage++;
                }

                [embed, actionRow] = buildResponse(hist.slice(Math.max(0, (currentPage - 1)*10), Math.min(hist.length, currentPage * 10)), currentPage, totalPages);

                await i.update({ embeds: [embed], components: [actionRow] });
            });
        } catch (error) {
            throw new Error(`There was an error running command gethist: ${error}`)
            await interaction.reply({ content: 'There was an error running this command', ephemeral: true })
        }
    }
}