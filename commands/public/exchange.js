const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { execute } = require('../balance/subbal');

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
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
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
        let message = "<a:7loading:1210687656703561758>";
        const multiplier = rec_rates[recieving_curr];
        if (sending_amt) {
            message += `You will recieve **\$${(sending_amt * multiplier).toFixed(2)} ${recieving_curr}** when sending **\$${sending_amt} ${sending_curr}**`
        } 
        if (recieving_amt) {
           message += `You must send **\$${(recieving_amt / multiplier).toFixed(2)} ${sending_curr}** to recieve **\$${recieving_amt} ${recieving_curr}**`
        }

        await interaction.reply({ content: message });
    }

}