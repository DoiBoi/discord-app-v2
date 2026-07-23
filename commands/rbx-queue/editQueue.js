const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const { addToQueue, getQueue, getEntries } = require("../../utils/queue");
const { getUserBalance } = require("../../utils/balance");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("editentry")
    .setDescription("updates an entry in the queue")
    .addNumberOption((option) =>
      option.setName("position")
        .setDescription("the position of the entry to be edited")
        .setRequired(true)
  )
    .addNumberOption((option) =>
      option
        .setName("amount")
        .setDescription("the new amount")
    )
    .addStringOption((option) =>
      option
        .setName("info")
        .setDescription("the new info")
    )
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const amount = interaction.options.getNumber("amount");
    const info = interaction.options.getString("info");
    if (!amount && !info) {
      return await interaction.editReply({
        content: "Please specify either amount or number!"
      })
    }
    const i = interaction.options.getNumber("position") - 1;
    const queue = await getQueue();
    let entry = queue[i]
    let entries = await getEntries(entry.user_id);
    entries = entries.map(item => {
      return item.amount
    })
    let old_amount = entry.amount;
    const sum = entries.reduce((accumulator, current) => accumulator + current, 0)
    const balance = await getUserBalance(entry.user_id)
    if ((balance.balance_rbx - (sum - old_amount) - amount) <= 0) {
      return await interaction.editReply({
        content: "Unable to edit as changing to this amount will result in a negative or zero value"
      })
    }
    let amount_string = `${old_amount.toLocaleString()}`;
    for (const pending of entry.pendings) {
      amount_string += `-${pending.toLocaleString()}`;
      old_amount -= pending;
    }
    if (entry.pendings.length > 0) {
      amount_string += `=${old_amount.toLocaleString()}`
    }
    let channel_string = "";
    for (const channel of entry.seller_channels) {
      channel_string += `<#${channel}> `
    }
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("yes")
        .setLabel("Yes")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("no")
        .setLabel("No")
        .setStyle(ButtonStyle.Secondary)
    )

    const string = `${i + 1}: <#${entry.buyer_channel}> \`${entry.info}\` ${amount_string} ${channel_string}\n`;
    const response = await interaction.editReply({
      content: `Is this the correct entry to edit?\n${string}`,
      components: [row]
    })

    const filter = (i) =>
      interaction.user.id === i.user.id &&
      (i.customId === "yes" || i.customId === "no");

    const collector = response.createMessageComponentCollector({
      filter,
      time: 60_000,
    });

    collector.on("collect", async (i) => {
      if (i.customId == "yes") {
        await addToQueue(entry.user_id, info ?? entry.gfsinfo, entry.buyer_channel, amount ?? entry.amount, entry.id, entry.date_created)
        await i.update({
          content: `Successfully edited`,
          components: []
        })
      } else {
        await i.update({
          content: "Please check /queue and select the correct one",
          components: []
        })
      }
    })
  },
};
