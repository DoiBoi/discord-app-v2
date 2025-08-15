const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('sum').setDescription('Calculates the sum of numbers in a message'),
    async execute(interaction) {
        const input = interaction.options.getString('input');
        const sum = calculateSum(input);
        await interaction.reply(`The sum is: ${sum}`);
    }
}

const calculateSum = (input) => {
    let sum = 0;
    const regEx = / [0-9]+k | [0-9]+k| [0-9]+.[0-9]+k| \b[0-9]+ | \b[0-9]+| \b[0-9]+,[0-9]+ |-[0-9]+:/g;
    console.log(input)
    let match = input.match(regEx);
    if (!match) return null;
    match = match.map((str) => {
        str = str.replace(" ", "").replace('-', '').replace(':', '');
        if (str.includes('k')) {
            str = str.replace('k', '');
            return parseFloat(str.replace(",", ".")) * 1000;
        }
        return parseFloat(str.replace(",", "."));
    });
    for (let i = 0; i < match.length; i++) sum += match[i];
    return sum;
}