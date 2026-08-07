const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const {
  getQueue,
  getEntries,
  deleteQueue,
} = require("../../utils/queue");
const { ids } = require("../../utils/config");
const { updateQueue, disableButtonRow } = require("../../utils/build");
const PENDING_TABLE = ids.pending;
const URL_REGEX = /\/channels\/\d+\/(\d+)\/(\d+)/;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rementry")
    .setDescription("removes an entry in the queue")
    .addNumberOption((option) =>
      option
        .setName("position")
        .setDescription("the position of the entry to be edited")
        .setRequired(true),
    )
    .setContexts(InteractionContextType.Guild),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const i = interaction.options.getNumber("position") - 1;
    const queue = await getQueue();
    let entry = queue[i];
    let entries = await getEntries(entry.user_id);
    entries = entries.map((item) => {
      return item.amount;
    });
    let old_amount = entry.amount;
    let amount_string = `${old_amount.toLocaleString()}`;
    for (const pending of entry[PENDING_TABLE]) {
      amount_string += `-[${pending.amount.toLocaleString()}](${pending.channel})`;
      old_amount -= pending.amount;
    }
    if (entry[PENDING_TABLE].length > 0) {
      amount_string += `=${old_amount.toLocaleString()}`;
    }
    let channel_string = "";
    for (const channel of entry[PENDING_TABLE]) {
      channel_string += `${channel.channel_name} `;
    }
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("yes")
        .setLabel("Yes")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("no")
        .setLabel("No")
        .setStyle(ButtonStyle.Secondary),
    );

    const string = `${i + 1}: ${entry.channel_name !== "" ? `[${entry.channel_name}](${entry.channel_url})` : `<#${entry.buyer_channel}>`} \`${entry.gfsinfo}\` ${amount_string} ${channel_string}\n`;
    const response = await interaction.editReply({
      content: `Is this the correct entry to edit?\n${string}`,
      components: [row],
    });

    const filter = (i) =>
      interaction.user.id === i.user.id &&
      (i.customId === "yes" || i.customId === "no");

    const collector = response.createMessageComponentCollector({
      filter,
      time: 60_000,
    });

    collector.on("collect", async (i) => {
      if (i.customId == "yes") {
        await i.deferReply({
          flags: MessageFlags.Ephemeral,
        });
        const response = await deleteQueue(entry.id);
        for (const item of response[PENDING_TABLE]) {
          const matches = item.channel.match(URL_REGEX);

          if (matches) {
            const channelId = matches[1];
            const messageId = matches[2];

            try {
              const channel = await interaction.client.channels.fetch(
                String(channelId),
              );
              const message = await channel.messages.fetch(String(messageId));

              await disableButtonRow(interaction, message);
            } catch (error) {
              console.log(`An error occured fetching channel ${error.message}`);
            }
          }
        }

        await i.editReply({
          content: "Successfuly deleted"
        });
        await updateQueue(i);
      } else {
        await i.update({
          content: "Please check /queue and select the correct one",
          components: [],
        });
      }
    });
  },
};
