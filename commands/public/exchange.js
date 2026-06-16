const { SlashCommandBuilder, InteractionContextType, MessageFlags, ButtonBuilder, SectionBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const sending_accounts = {
    "USDT BEP20": "0x269125694789Aec887d288b5858744e894bD6AFA",
    "USDT ERC20": "0x269125694789Aec887d288b5858744e894bD6AFA",
    "USDT SOL": "0x269125694789Aec887d288b5858744e894bD6AFA",
    "USDC SOL": "6wfpRFVFGQ7DXh9p8wqsuXJpJh4JRK8ZA41x9ECiA69N",
    "ETH": "0x269125694789Aec887d288b5858744e894bD6AFA",
    "LTC": "LNa6ZbJrev2dpVPDdUkmuPkyueyLgx3Enx",
    "SOL": "6wfpRFVFGQ7DXh9p8wqsuXJpJh4JRK8ZA41x9ECiA69N",
    "Interac": "same email as previously. If you're a new customer, ping <@1474220722665558066> for help",
}

const rec_rates = {
    "PayPal": 0.97,
    "CashApp": 0.97,
    "Zelle": 0.97,
    "Venmo": 0.97,
    "Crypto": 0.98,
    "Interac": 0.93,
    "Alipay HK": 1
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("exchange")
        .setDescription("INSERT DESCRIPTION HERE")
        .setContexts(InteractionContextType.Guild)
        .addStringOption(option =>
            option.setName("sending_curr")
                .setDescription("The currency you're looking to send in")
                .setRequired(true)
                .addChoices(
                    { name: "USDT BEP20", value: "USDT BEP20" },
                    { name: "USDT ERC20", value: "USDT ERC20" },
                    { name: "USDT SOL", value: "USDT SOL" },
                    { name: "USDC SOL", value: "USDC SOL" },
                    { name: "ETH", value: "ETH" },
                    { name: "LTC", value: "LTC" },
                    { name: "SOL", value: "SOL" },
                    { name: "Interac", value: "Interac" }
                )
        )
        .addStringOption(option =>
            option.setName("recieving_curr")
                .setDescription("The currency you're looking to recieve in")
                .addChoices(
                    { name: "PayPal", value: "PayPal" },
                    { name: "CashApp", value: "CashApp" },
                    { name: "Zelle", value: "Zelle" },
                    { name: "Venmo", value: "Venmo" },
                    { name: "Crypto", value: "Crypto" },
                    { name: "Interac", value: "Interac" },
                    { name: "Alipay HK", value: "Alipay HK" }
                )
        )
        .addNumberOption(option =>
            option.setName("sending_amt")
                .setDescription("The amount you're sending")
                .setMinValue(0.0)
        )
        .addNumberOption(option =>
            option.setName("recieving_amt")
                .setDescription("The amount you are recieving")
                .setMinValue(0.0)
        ),
    async execute(interaction) {
        const recieving_amt = interaction.options.getNumber("recieving_amt")
        const sending_amt = interaction.options.getNumber("sending_amt")
        const recieving_curr = interaction.options.getString("recieving_curr")
        const sending_curr = interaction.options.getString("sending_curr")

        if (recieving_amt && sending_amt) {
            await interaction.reply({
                content: "Please specify only ONE of `recieving_amt` or `sending_amt`",
                flags: MessageFlags.Ephemeral
            })
            return
        }
        if (!recieving_amt && !sending_amt) {
            await interaction.reply({
                content: "Please specify one of `recieving_amt` or `sending_amt`",
                flags: MessageFlags.Ephemeral
            })
            return
        }
        let message = "";

        const multiplier = rec_rates[recieving_curr];
        if (sending_amt) {
            message += `You will recieve **\$${(sending_amt * multiplier).toFixed(2)} ${recieving_curr}** when sending **\$${sending_amt} ${sending_curr}**`
        }
        if (recieving_amt) {
            message += `You must send **\$${(recieving_amt / multiplier).toFixed(2)} ${sending_curr}** to recieve **\$${recieving_amt} ${recieving_curr}**`
        }

        const continueButton = new ButtonBuilder().setCustomId('continue').setLabel('Continue').setStyle(ButtonStyle.Success)
        const cancelButton = new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
        const actionRow = new ActionRowBuilder().addComponents(continueButton, cancelButton)

        const sentMessage = await interaction.reply({
            content: `-# <:warn:1515496427504275546> the button expires in 3 minutes, ping mal if you exceed this time \n\n${message}\n\nSend to ${sending_curr == "Interac" ? sending_accounts[sending_curr] : `\`${sending_accounts[sending_curr]}\``} \nOnce done, screenshot and click complete`,
            components: [actionRow]
        });

        const disableButtons = async () => {
            continueButton.setDisabled(true)
            cancelButton.setDisabled(true)
            const disabledRow = new ActionRowBuilder().addComponents(continueButton, cancelButton)

            await sentMessage.edit({ components: [disabledRow] })
        }

        const collector = sentMessage.createMessageComponentCollector({
            time: 180000
        })

        collector.on('collect', async (interaction) => {
            await interaction.deferUpdate()
            if (interaction.customId == 'continue') {
                interaction.followUp({
                    content: `<a:loading:1515496585339998311> wait for <@1474220722665558066> to review this & complete the exchange.\nPlease provide the ${recieving_curr} payment information while you wait`
                })
            }
            await disableButtons()
        })

        setTimeout(async () => {
            await disableButtons()
        }, 180000)


    }
}