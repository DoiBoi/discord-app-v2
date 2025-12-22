const { SlashCommandBuilder,
    InteractionContextType,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');
const { getPaginatedBalances, getUserInfo } = require('../../utils/balance.js');
const { execute } = require('./getbal.js');

let gfs_toggle = false;
let owe_toggle = false;
let info_toggle = false;
const PERPAGE = 10;

function buildResponse(data, currentPage, totalPages) {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('User Balances')
        .setDescription(`Here are ${info_toggle ? 'the infos of ' : ''} the user balances${gfs_toggle ? '[GFS]' : ''}${owe_toggle ? '[OWE]' : ''}:`)
        .addFields(data.map((user) => ({
            name: '',
            value: `<@${user.id}> | **USD**: $${user.balance_usd.toFixed(2)} | **RBX**: ${user.balance_rbx}\n${getUserInfo(user.info, {
                gfs_toggle: gfs_toggle,
                owe_toggle: owe_toggle,
                info_toggle: info_toggle
            })}`,
        })));
    embed.setFooter({ text: `Page ${currentPage} of ${totalPages}` });

    const leftButton = new ButtonBuilder()
        .setCustomId('left')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('⬅️');
    if (currentPage <= 1) leftButton.setDisabled(true);

    const GFSButton = new ButtonBuilder()
        .setLabel('GFS')
        .setCustomId('gfs')
        .setStyle(ButtonStyle.Secondary)

    const OWEButton = new ButtonBuilder()
        .setLabel('OWE')
        .setCustomId('owe')
        .setStyle(ButtonStyle.Secondary)

    const InfoButton = new ButtonBuilder()
        .setLabel('PAY')
        .setCustomId('pay')
        .setStyle(ButtonStyle.Secondary)

    const rightButton = new ButtonBuilder()
        .setCustomId('right')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('➡️');
    if (currentPage >= totalPages) rightButton.setDisabled(true);


    const actionRow = new ActionRowBuilder()
        .addComponents(leftButton, GFSButton, OWEButton, InfoButton, rightButton);
    return [embed, actionRow];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listbals')
        .setDescription('Lists user balances with pagination')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        try {
            let currentPage = 1;
            let [data, count] = await getPaginatedBalances(currentPage, PERPAGE, gfs_toggle, owe_toggle, info_toggle);
            let totalPages = Math.ceil(count / 10);

            let [embed, actionRow] = buildResponse(data, currentPage, totalPages);

            const response = await interaction.reply({ embeds: [embed], components: [actionRow], withResponse: true , flags: MessageFlags.Ephemeral});

            const filter = i => i.user.id === interaction.user.id && 
                                (i.customId === 'left' || i.customId === 'right' || i.customId === 'gfs' || i.customId === 'owe' || i.customId === 'pay');

            const collector = response.resource.message.createMessageComponentCollector({ filter, time: 180_000 });

            collector.on('collect', async (i) => {
                switch (i.customId) {
                    case 'gfs':
                        gfs_toggle = !gfs_toggle;
                        currentPage = 1;
                        break;
                    case 'owe':
                        owe_toggle = !owe_toggle;
                        currentPage = 1;
                        break;
                    case 'pay':
                        info_toggle = !info_toggle;
                        currentPage = 1;
                        break;
                    case 'left':
                        currentPage--;
                        break;
                    case 'right':
                        currentPage++;
                        break;
                }
            
                [data, count] = await getPaginatedBalances(currentPage, PERPAGE, gfs_toggle, owe_toggle, info_toggle);
                totalPages = Math.max(Math.ceil(count / 10), 1);
                [embed, actionRow] = buildResponse(data, currentPage, totalPages);

                await i.update({ embeds: [embed], components: [actionRow] });
            });

        } catch (error) {
            console.error('Error executing listbals command:', error);
            await interaction.reply({ content: 'There was an error while executing this command.', flags: MessageFlags.Ephemeral });
        }
    }
}