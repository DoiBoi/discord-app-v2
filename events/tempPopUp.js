const { getExchange } = require("../utils/temp_exchage")
const { MessageFlags } = require("discord.js")
const { buildChannelDropdown } = require("../utils/build.js");

async function handlePopUp(interaction) {
  const item = await getExchange(interaction.customId.match(/\d+/gm)[0]);
  const input = parseFloat(
    interaction.fields.getTextInputValue("temp-input"),
  );

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
  const filter = (i) =>
    i.customId === "select-channel" && i.user.id === interaction.user.id;

  const collector =
    channelResponse.resource.message.createMessageComponentCollector({
      filter,
      time: 60_000,
    });

  collector.on("collect", async (i) => {
    await handleChannelDropdown(i, item, input);
  });

  collector.on("end", async (collected, reason) => {
    if (reason === "time") {
      await interaction.editReply({
        components: [],
      });
    }
  });
}

module.exports = {
  handlePopUp
}
