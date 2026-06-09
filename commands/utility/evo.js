const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { calcDiff } = require('../../utils/evo_fee_calculator')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("evo")
        .setDescription("Calculates the evo fee difference if you do a stopover or two-stops")
        .addNumberOption(option =>
            option.setName("travel")
                .setDescription("Total amount of time needed to travel")
                .setRequired(true)
        )
        .addNumberOption(option =>
            option.setName("stopover")
                .setDescription("The stopover time")
                .setRequired(true)
        )
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const travel_time = interaction.options.getNumber("travel");
        const stopover_time = interaction.options.getNumber("stopover");

        const [two_trip_cost, stopover_trip_cost, diff] = calcDiff(travel_time, stopover_time);

        let string = `Total cost for two trips: **$${two_trip_cost}**\nTotal cost for trip with stopover: **$${stopover_trip_cost}**\n`;

        // Prints the actual result we want to know from all the calculations
        if (diff > 0) {
            string += `:green_circle: You will save **$${Math.round(100 * diff) / 100}** from doing a stopover instead of two trips.`;
        } else if (diff < 0) {
            string += `:red_circle: You will lose **$${Math.round(100 * Math.abs(diff)) / 100}** from doing a stopover instead of two trips.`;
        } else {
            // This is actually never possible because of the access fee, but it's still here
            string += "It doesn't matter, choose either.";
        }
        await interaction.reply({ content: string, ephermeral: true});
    }
}