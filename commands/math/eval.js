const { SlashCommandBuilder, InteractionContextType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eval')
        .setDescription('Evaluates a mathematical expression')
        .addStringOption(option =>
            option.setName('expression')
                .setDescription('The mathematical expression to evaluate')
                .setRequired(true)
        )
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
    async execute(interaction) {
        const expression = interaction.options.getString('expression');
        try {
            
            const result = eval(expression.replaceAll("x", "*"));
            await interaction.reply(`:1234: Result: ${result}`);
        } catch (error) {
            await interaction.reply(`:1234: Error: ${error.message}`);
        }
    }
}