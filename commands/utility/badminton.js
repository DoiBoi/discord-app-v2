const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
} = require("discord.js");

const { getNewUsers } = require("../../utils/badminton");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("newplayers")
    .setDescription("Finds new players of the upcoming badminton session")
    .addStringOption((option) =>
      option
        .setName("names")
        .setDescription("The names of players separate by space"),
    )
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ),
  async execute(interaction) {
    let names = interaction.options.getString("names");
    const result = await getNewUsers(names);

    await interaction.reply({
      content: `The new players for this session is:\n\`\`\`${result.join("\n")}\`\`\``,
    });
  },
};
