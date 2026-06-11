const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { execute } = require('../balance/subbal');

const send_currency = {
    bep20: 1,
    erc20: 1,
    usdt_sol: 1,
    usdc_sol: 1,
    eth: 1,
    ltc: 1,
    sol: 1,
    interac: 1
}

const rec_currency = {
    paypal: 0.97,
    cashapp: 0.97,
    zelle: 0.97,
    venmo: 0.97,
    crypto: 0.98,
    interac: 0.93,
    alipayhk: 1
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("exchange")
        .setDescription("INSERT DESCRIPTION HERE")
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
        .addStringOption(option =>
            option.setName("sending_cur")
                .setDescription("The currency you're looking to send in")
                .setRequired(true)
                .addChoices(
                    { name: "USDT BEP20", value: "bep20" },
                    { name: "USDT ERC20", value: "erc20" },
                    { name: "USDT SOL", value: "usdt_sol" },
                    { name: "USDC SOL", value: "usdc_sol" },
                    { name: "ETH", value: "eth" },
                    { name: "LTC", value: "LTC" },
                    { name: "SOL", value: "sol" },
                    { name: "Interac", value: "interac" }
                )
        )
        .addStringOption(option =>
            option.setName("recieving_curr")
                .setDescription("The currency you're looking to recieve in")
                .addChoices(
                    { name: "PayPal", value: "paypal" },
                    { name: "CashApp", value: "cashapp" },
                    { name: "Zelle", value: "zelle" },
                    { name: "Venmo", value: "venmo" },
                    { name: "Crypto", value: "crypto" },
                    { name: "Interac", value: "interac" },
                    { name: "Alipay HK", value: "alipayhk" }
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
        let message = ""
        if (sending_amt) {

        }
    }

}