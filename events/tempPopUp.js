const {
  getExchange,
  setSelectChannel,
  getProgress,
} = require("../utils/temp_exchage");
const {
  MessageFlags,
  PermissionFlagsBits,
  ButtonBuilder,
  ActionRowBuilder,
} = require("discord.js");
const { buildChannelDropdown } = require("../utils/build.js");

async function handlePopUp(interaction) {
  const id = interaction.customId.match(/\d+/gm)[0];
  const item = await getExchange(id);
  const input = parseFloat(interaction.fields.getTextInputValue("temp-input"));

  if (isNaN(input)) {
    return await interaction.reply({
      content: "Please input a valid number!",
      flags: MessageFlags.Ephemeral,
    });
  }

  const amount = item["amount"] - item["pending"];
  if (
    (amount > item["min"] && (input < item["min"] || input > amount)) ||
    (amount <= item["min"] && input != amount)
  ) {
    return await interaction.reply({
      content:
        "Please input a valid amount! It must be between the minimum & maximum that the exchange can do.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const channelResponse = await interaction.reply({
    content: `Select the channel to do this exchange in\n-# Button will not work <t:${calculateTimeStamp(60)}:R>`,
    components: [buildChannelDropdown()],
    flags: MessageFlags.Ephemeral,
    withResponse: true,
  });

  await setSelectChannel(
    id,
    interaction,
    input,
    channelResponse.resource?.message?.id,
    channelResponse.resource?.message?.channelId,
  );
  // const filter = (i) =>
  //   i.customId === "select-channel" && i.user.id === interaction.user.id;

  // const collector =
  //   channelResponse.resource.message.createMessageComponentCollector({
  //     filter,
  //     time: 60_000,
  //   });

  // collector.on("collect", async (i) => {
  //   await handleChannelDropdown(i, item, input);
  // });

  // collector.on("end", async (collected, reason) => {
  //   if (reason === "time") {
  //     await interaction.editReply({
  //       components: [],
  //     });
  //   }
  // });
}

async function handleChannelDropdown(interaction) {
  const item = await getProgress(interaction.message.id, interaction.channelId);
  await interaction.deferUpdate();
  const targetChannel = interaction.guild.channels.cache.get(
    interaction.values[0],
  );

  const requiredPerms = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
  ];

  const botMember = interaction.guild.members.me;

  if (
    !targetChannel.permissionsFor(interaction.user).has(requiredPerms) ||
    !targetChannel.permissionsFor(botMember).has(requiredPerms) ||
    targetChannel.type !== ChannelType.GuildText
  ) {
    return await interaction.followUp({
      content: "You do not have permission to view or select that channel.",
      ephemeral: true,
    });
  }

  const agreeButton = new ButtonBuilder()
    .setCustomId("tos-agree")
    .setLabel("I Agree")
    .setStyle(ButtonStyle.Success);

  const cancelButton = new ButtonBuilder()
    .setCustomId("tos-cancel")
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(agreeButton, cancelButton);

  const TOSResponse = await targetChannel.send({
    content: buildTOSMessage(item["currency"], input, interaction.user.id),
    components: [row],
  });

  await setTOS(
    item["id"],
    interaction,
    TOSResponse.resource?.message?.id,
    TOSResponse.resource?.message?.channelId,
  );

  // const filter = (i) => interaction.user.id === i.user.id;

  // const newCollector = TOSResponse.createMessageComponentCollector({
  //   filter,
  //   time: 300_000,
  // });

  // newCollector.on("collect", async (i) => {
  //   await handleTOS(i, row, item, input);

  //   newCollector.stop();
  // });

  // newCollector.on("end", async (collected, reason) => {
  //   if (reason === "time") {
  //     const timedOutRow = new ActionRowBuilder().addComponents(
  //       row.components.map((button) =>
  //         ButtonBuilder.from(button).setDisabled(true),
  //       ),
  //     );

  //     await TOSResponse.edit({
  //       components: [timedOutRow],
  //     }).catch(console.error);
  //   }
  // });

  // await interaction.editReply({
  //   components: [],
  // });
}

module.exports = {
  handlePopUp,
  handleChannelDropdown,
};
