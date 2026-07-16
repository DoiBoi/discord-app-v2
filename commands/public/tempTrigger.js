const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
  ButtonBuilder,
  SectionBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const { getId, upsertId } = require("../../utils/id.js");
const { getUserBalance } = require("../../utils/balance.js");
const { getExchanges, updateExchange } = require("../../utils/temp_exchage.js");

const ORDER = {
  CashApp: "<:cashapp:1515497126518329505>",
  Zelle: "<:zelle:1515497124190617722>",
  Venmo: "<:venmo:1515497122794045440>",
  PayPal: "<:paypal:1515497121560920114>",
};

function buildMessage(item) {
  const amount = Math.round((item["amount"] - item["pending"]) * 100) / 100;
  const calculated_fee = ((amount * (100 - item["fee"])) / 100).toFixed(2);
  let currency_text;
  if (item["currency"] == "PayPal") {
    currency_text = `${item["currency"]} (${item["fnf"] ? "cover" : "minus"} fnf fee)`;
  } else {
    currency_text = item["currency"];
  }
  let ret = `Your \$${amount} ${currency_text} for my \$${calculated_fee} crypto, ${item["fee"]}\% fee`;
  if (item["min"] == 0) {
    ret += "\n> no min";
  } else {
    if (item["min"] > calculated_fee) {
      ret += "\n> must do all";
    } else {
      ret += `\n> min \$${item["min"]}`;
    }
  }
  return ret;
}

function buildResponse(exchanges, ping) {
  let message =
    `${ping ? "<@&1474255029241249913>\n" : ""}[  <:pinkpin:1515497127751585942>  ]  Use the hidden text in brackets (first 3 letters of the payment details) to keep track of the amount left\n`;
  for (const [currency, emoji] of Object.entries(ORDER)) {
    message += `# ${currency} ${emoji}\n`;
    if (currency == "PayPal") {
      message +=
        "> - can exchange __any amount lower than amounts stated__, but custom amounts = +1%\n\n";
    }
    const items = exchanges[currency];
    if (items == null) {
      message += "> none atm\n";
      continue;
    }
    const visibleItems = items.filter((item) => {
      const remaining =
        Math.round((item["amount"] - item["pending"]) * 100) / 100;
      return remaining > 0;
    });

    if (visibleItems.length === 0) {
      message += "> none atm\n";
      continue;
    }

    switch (visibleItems.length) {
      case 0:
        message += "> none atm\n";
        break;
      case 1:
        message += `${buildMessage(visibleItems[0])}\n`;
        break;
      default:
        for (let i = 0; i < visibleItems.length; i++) {
          if (i === visibleItems.length - 1) {
            message += `${buildMessage(visibleItems[i])}\n`;
          } else {
            message += `${buildMessage(visibleItems[i])}\n\n`;
          }
        }
    }
  }
  return message;
}

function buildDropdown(exchanges) {
  const options = [];
  for (const [currency, emoji] of Object.entries(ORDER)) {
    const items = exchanges[currency];
    if (items == null) {
      continue;
    }
    for (const item of items) {
      const amount = Math.round((item["amount"] - item["pending"]) * 100) / 100;
      if (amount <= 0) continue;
      let additionalText = "";
      if (currency == "PayPal") {
        additionalText = ` (${item["fnf"] ? "cover" : "minus"} fnf fee)`;
      }

      options.push(
        new StringSelectMenuOptionBuilder()
          .setLabel(
            `${currency}: \$${amount.toFixed(2)} for \$${((amount * (100 - item["fee"])) / 100).toFixed(2)} Crypto${additionalText}, ${item["fee"]}\% fee, min \$${item["min"]}`,
          )
          .setValue(String(item["id"]))
          .setEmoji(emoji),
      );
    }
  }

  if (options.length === 0) {
    return null;
  }

  const dropdown = new StringSelectMenuBuilder()
    .setCustomId("dropdown")
    .setPlaceholder("Claim an exchange")
    .addOptions(options);
  return dropdown;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("temptrigger")
    .setDescription("Triggers a temp exchange")
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The Discord tag of the receiver")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("recieving")
        .setDescription("The currency they're recieving in")
        .setRequired(true)
        .addChoices(
          { name: "PayPal", value: "PayPal" },
          { name: "CashApp", value: "CashApp" },
          { name: "Zelle", value: "Zelle" },
          { name: "Venmo", value: "Venmo" },
        ),
    )
    .addNumberOption((option) =>
      option
        .setName("fee")
        .setDescription("The exchange fee you want to charge")
        .setRequired(true)
        .setMinValue(0.0),
    )
    .addNumberOption((option) =>
      option
        .setName("min")
        .setDescription("The minimum amount that senders can claim")
        .setRequired(true)
        .setMinValue(0.0),
    )
    .addBooleanOption((option) =>
      option
        .setName("fnf")
        .setDescription("If FNF fee for a Paypal exchange should be covered or not"),
  ).addBooleanOption((option) =>
    option
      .setName("ping")
      .setDescription("To ping or not")),
  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const recieving = interaction.options.getString("recieving");
    const fee = interaction.options.getNumber("fee");
    const min = interaction.options.getNumber("min");
    const fnf = interaction.options.getBoolean("fnf");
    const ping = interaction.options.getBoolean("ping");

    await interaction.deferReply({ ephemeral: true });
    if (recieving == "PayPal" && fnf === null) {
      return await interaction.reply({
        content: "Please specify if FNF is covered or not",
        flags: MessageFlags.Ephemeral,
      });
    }

    let channel, message;
    const channel_id = await getId("channel_id");
    const message_id = await getId("message_id");
    const userBalance = (await getUserBalance(user.id)) ?? 0;

    try {
      channel = await interaction.client.channels.fetch(String(channel_id));
    } catch {
      return await interaction.editReply({
        content: "Could not find the target channel.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      message = await channel.messages.fetch(String(message_id));
      await message.delete();
    } catch { }

    await updateExchange({
      amount: userBalance ? userBalance["balance_usd"] : 0,
      user_id: user.id,
      fee: fee,
      currency: recieving,
      fnf: fnf,
      min: min,
      channel: interaction.channelId,
    });

    const exchanges = await getExchanges();
    const dropdown = buildDropdown(exchanges);
    const components = dropdown
      ? [new ActionRowBuilder().addComponents(dropdown)]
      : [];

    const response = await channel.send({
      content: buildResponse(exchanges, ping),
      components,
    });

    await upsertId("message_id", response.id);

    return await interaction.editReply({
      content: `Message sent in ${response.url}`,
      flags: MessageFlags.Ephemeral,
    });
  },
  buildDropdown,
  buildMessage,
  buildResponse,
  ORDER
};
