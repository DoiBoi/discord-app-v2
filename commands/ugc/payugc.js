const {
  SlashCommandBuilder,
  MessageFlags,
  InteractionContextType,
  TextDisplayBuilder,
  LabelBuilder,
  TextInputStyle,
} = require("discord.js");
const { fetchGroups } = require("../../utils/ugc");
const { ModalBuilder } = require("discord.js");
const { TextInputBuilder } = require("discord.js");
const { ids } = require("../../utils/config");
const TABLE = ids.ugc_queue;


module.exports = {
  data: new SlashCommandBuilder()
    .setName("payugc")
    .setDescription("Pays out entries to queue")
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ),
  async execute(interaction) {
    const groups = await fetchGroups();
    const entries = groups.map((item) => {
      return {
        name: item.id,
        amount: item.amount,
        order: item.order,
        users: item[TABLE].reduce((acc, curr) => {
          if (!acc[curr.channel_id]) {
            acc[curr.channel_id] = [];
          }
          acc[curr.channel_id].push(curr);
          return acc;
        }, {}),
      };
    });
    let index = 0
    const content = entries.reduce((acc, curr) => {
      let sum = 0;
      const usersText = Object.entries(curr.users)
        .map(([channelId, rows]) => {
          const rowsText = rows
            .map((row) => {
              sum += row.amount;
              index++;
              return `- ${index}. \`${row.username}\` ${row.amount.toLocaleString()} ${row.log ? `:green_circle:` : `:red_circle:`}`;
            })
            .join("\n");
          return `<#${channelId}> (${rows[0].rate})\n${rowsText}\n`;
        })
        .join("\n");
      const remainingText =
        curr.amount - sum > 0
          ? `${curr.amount - sum} remaining`
          : `${Math.abs(curr.amount - sum)} pre-ordered`;
      acc += `# ${curr.name} (${curr.order}) ${curr.amount.toLocaleString()}\n${usersText}= ${remainingText}\n`;
      return acc;
    }, ``);

    const modal = new ModalBuilder()
      .setCustomId("pay-ugc")
      .setTitle("Pay UGC")
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
      .addLabelComponents(
        new LabelBuilder()
          .setLabel("Insert entries:")
          .setDescription("Separate groups by new line and format as [POSITION]/[AMOUNT]")
          .setTextInputComponent(
            new TextInputBuilder()
              .setCustomId("entries-input")
              .setStyle(TextInputStyle.Paragraph),
          ),
      );
    await interaction.showModal(modal);
  },
};
