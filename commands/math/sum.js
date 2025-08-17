const { SlashCommandBuilder, InteractionContextType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sum')
        .setDescription('Calculates the sum of numbers in a message')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
        .addStringOption(option =>
            option.setName('input')
                .setDescription('The input text to calculate the sum from')
                .setRequired(true)),

    async execute(interaction) {
        const input = interaction.options.getString('input');
        const sum = calculateSum(input);
        await interaction.reply(`The sum is: ${sum}`);
    }
}

const calculateSum = (input) => {
    let sum = 0;
    if (input.length > 0 && !isNaN(parseInt(input[0], 10))) {
        input = "a " + input;
    }
    const regEx = / [0-9]+,[0-9]+ | [0-9]+,[0-9]+| [0-9]+k | [0-9]+k| [0-9]+.[0-9]+k| \b[0-9]+ | \b[0-9]+| \b[0-9]+,[0-9]+ |-[0-9]+:/g;
    let match = input.match(regEx);
    if (!match) return null;
    match = match.map((str) => {
        str = str.replace(" ", "").replace('-', '').replace(':', '').replace(',', '');
        if (str.includes('k')) {
            str = str.replace('k', '');
            return parseFloat(str.replace(",", ".")) * 1000;
        }
        return parseFloat(str.replace(",", "."));
    });
    for (let i = 0; i < match.length; i++) sum += match[i];
    return sum;
}