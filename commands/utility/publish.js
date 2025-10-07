const { SlashCommandBuilder, InteractionContextType } = require('discord.js');

function roundToDecimalPlaces(num, decimalPlaces) {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(num * factor) / factor;
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName("upub")
        .setDescription("Calculates the price for uploads & publishes")
        .addNumberOption(option =>
            option.setName("hatorface")
                .setDescription("Number of hat or face accessories")
        )
        .addNumberOption(option =>
            option.setName("other")
                .setDescription("Other accessories")
        )
        .addNumberOption(option =>
            option.setName("totaluploads")
                .setDescription("Count of total uploads")
        )
        .addNumberOption(option =>
            option.setName("recolors")
                .setDescription("Count of recolors")
        )
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const hatorface = interaction.options.getNumber("hatorface")
        const other = interaction.options.getNumber("other")
        const totaluploads = interaction.options.getNumber("totaluploads")
        const recolors = interaction.options.getNumber("recolors")
        const upload_usd = ((totaluploads - recolors) * 4.9) + (recolors * 4.5)
        const publish_usd = (hatorface * 6.7) + (other * 4.5)
        const upload_rbx = (totaluploads * 1.3) * 1000
        const publish_rbx = ((hatorface * 1.8) + (other * 1.4)) * 1000

        let base = `**Uploads:** ${totaluploads} total uploads, ${recolors} of them being recolors. \n**Publishes:** ${hatorface} hat/face accessories and ${other} other accessories.`;
        const USD_uploading = `- The USD **upload** price is $${roundToDecimalPlaces(upload_usd, 2)}.`
        const USD_publishing = (`- The USD **publish** price is $${roundToDecimalPlaces(publish_usd, 2)}`)
        const RBX_uploading = (`- The Robux **upload** price is ${roundToDecimalPlaces(upload_rbx, 2)} robux.`)
        const RBX_publishing = (`- The Robux **publish** price is ${roundToDecimalPlaces(publish_rbx, 2)} robux.`)
        const USD_header = ("`  USD Price  `");
        const RBX_header = ("`  Robux Price  `");
        if (totaluploads === 0) {
            return interaction.reply({content: base + "\n" + "\n" + USD_header + "\n" + USD_publishing + "\n" + "\n" + RBX_header + "\n" + RBX_publishing});
        } else if (hatorface >= 1 || other >= 1) {
            return interaction.reply({content: base + "\n" + "\n" + USD_header + "\n" + USD_uploading + "\n" + USD_publishing + "\n" + "\n" + RBX_header + "\n" + RBX_uploading + "\n" + RBX_publishing});
        } else {
            return  interaction.reply({content: base + "\n" + "\n" + USD_header + "\n" + USD_uploading + "\n" + "\n" + RBX_header + "\n" + RBX_uploading});    
        }    
    }
}