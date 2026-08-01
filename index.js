require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const adminCommands = require("./commands.json");
const { auth, supabase } = require("./utils/supabase/supabase_client.js");
const { getExchange, finalizeTemp, addMessage, removeMessage } = require("./utils/temp_exchage.js");
const { editBalance, getUserInfo } = require("./utils/balance");
const { getId } = require("./utils/id.js");
const {
  buildTempModal,
  buildChannelDropdown,
  updateBoard,
  buildSuccessContainer,
} = require("./utils/build.js");
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
  ActivityType,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ContainerBuilder,
} = require("discord.js");
const { ORDER } = require("./commands/public/tempTrigger");
const { ids, emojis } = require("./utils/config.js");
const { appendUserHistory } = require("./utils/history");
const { EmbedBuilder } = require("discord.js");
const { Embed } = require("discord.js");
const { handleButtonInput } = require("./handler/buttonEvents.js");
const RPC = ids.rpc;
const LOG = ids.log;

const FLAGS = {
  gfs_toggle: false,
  owe_toggle: false,
  info_toggle: true,
  new_line: false,
};

const ARROW = `<:arrow:${emojis.arrow}>`;
const cancelEmbed = new EmbedBuilder()
  .setAuthor({
    name: "Exchange Cancelled",
    iconURL: "https://cdn.discordapp.com/emojis/950076641667846224.webp?size=128"
  })

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessageReactions,
  ],
});

function buildTOSMessage(currency, amount, user) {
  const embeds = [];
  switch (currency) {
    // TODO
    case "PayPal":
      embeds.push(
        new EmbedBuilder().setDescription(
          "## Please read the following message carefully!",
        ),
      );
      embeds.push(
        new EmbedBuilder().setDescription(`\`\`\`Disclaimer\`\`\`
        **📌 Make sure you are ready to send.**
        You must send the money within 5 minutes (after pressing "I agree") because if you send outside of reserved duration, you risk losing your funds.

        \`\`\`Sending Instructions\`\`\`
        **<:paypal:${emojis.paypal}> Follow this when you send:**
        ${ARROW} __Screen record__
        ${ARROW} Use __Mobile app__
        ${ARROW} Ensure __"Receiver gets" USD__
        ${ARROW} Select __Friends & Family__
        ${ARROW} Use __Paypal balance__
        ${ARROW} Show __Receipt page__`),
      );
      embeds.push(
        new EmbedBuilder()
          .setDescription(
            `**⚠️ Warning! Failure to instructions = $2 penalty fee**
       > If you send bank, card, gns payments and/or you don't screen record from mobile app, I will not release the crypto. The account you are sending to does not belong to me. I will do my best to refund you ASAP, however I will charge you for wasting me & the receiver's time.`,
          )
          .setThumbnail(
            `https://cdn.discordapp.com/attachments/853109872698982451/1530417765310009344/output-onlinegiftools.gif?ex=6a65801d&is=6a642e9d&hm=41ef422911140f64a330216239aef9ecbad107a51ed51f4db9b1d588986f07ee&`,
          ),
      );
      embeds.push(
        new EmbedBuilder().setDescription(
          `\`\$${amount.toFixed(2)}\` of the Paypal exchange will be reserved for you for 5 minutes after you agree to following the instructions.`,
        ),
      );
      return embeds;
    case "CashApp":
      embeds.push(
        new EmbedBuilder().setDescription(
          `## Please read the following message carefully!`,
        ),
      );
      embeds.push(
        new EmbedBuilder().setDescription(`\`\`\`Disclaimer\`\`\`
        **📌 Make sure you are ready to send.**
        You must send the money within 5 minutes (after pressing "I agree") because if you send outside of reserved duration, you risk losing your funds.

        \`\`\`Sending Instructions\`\`\`
        **<:cashapp:${emojis.cashapp}> Follow this when you send:**
        ${ARROW} __Screen record__
        ${ARROW} Use __Mobile app__
        ${ARROW} Use __Cash balance__
        ${ARROW} Write __"Food" note__
        ${ARROW} Show __Receipt page__`),
      );
      embeds.push(
        new EmbedBuilder()
          .setDescription(
            `**⚠️ Warning! Failure to instructions = $2 penalty fee**
      > If you send bank, card, and/or notes related to the exchange, I will not release the crypto. The account you are sending to does not belong to me. I will do my best to refund you ASAP, however I will charge you for wasting me & the receiver's time.`,
          )
          .setThumbnail(
            `https://cdn.discordapp.com/attachments/853109872698982451/1530417765310009344/output-onlinegiftools.gif?ex=6a65801d&is=6a642e9d&hm=41ef422911140f64a330216239aef9ecbad107a51ed51f4db9b1d588986f07ee&`,
          ),
      );
      embeds.push(
        new EmbedBuilder().setDescription(
          `\`\$${amount.toFixed(2)}\` of the Cashapp exchange will be reserved for you for 5 minutes after you agree to following the instructions.`,
        ),
      );
      return embeds;
    case "Zelle":
      embeds.push(
        new EmbedBuilder()
          .setTitle(`📌  Make sure you are ready to send!`)
          .setDescription(
            `You must send the money within 5 minutes (after pressing "I agree") because if you send outside of reserved duration, you risk losing your funds.`,
          )
          .setThumbnail(
            `https://cdn.discordapp.com/attachments/853109872698982451/1530417765310009344/output-onlinegiftools.gif?ex=6a65801d&is=6a642e9d&hm=41ef422911140f64a330216239aef9ecbad107a51ed51f4db9b1d588986f07ee&`,
          ),
      );
      embeds.push(
        new EmbedBuilder().setDescription(
          `\`\$${amount.toFixed(2)}\` of the Zelle exchange will be reserved for you for 5 minutes after pressing "I agree"`,
        ),
      );
      return embeds;
    case "Venmo":
      embeds.push(
        new EmbedBuilder()
          .setTitle(`📌  Make sure you are ready to send!`)
          .setDescription(
            `You must send the money within 5 minutes (after pressing "I agree") because if you send outside of reserved duration, you risk losing your funds.`,
          )
          .setThumbnail(
            `https://cdn.discordapp.com/attachments/853109872698982451/1530417765310009344/output-onlinegiftools.gif?ex=6a65801d&is=6a642e9d&hm=41ef422911140f64a330216239aef9ecbad107a51ed51f4db9b1d588986f07ee&`,
          ),
      );
      embeds.push(
        new EmbedBuilder().setDescription(
          `\`\$${amount.toFixed(2)}\` of the Venmo exchange will be reserved for you for 5 minutes after pressing "I agree"`,
        ),
      );
      return embeds;
    default:
      return [];
  }
}

function calculateTimeStamp(seconds) {
  return Math.floor(Date.now() / 1000) + seconds;
}

const CONFIRM_REGEX = /\d+\.\d+|\d+/gm;

async function handleSendComplete(
  interaction,
  actionRow,
  item,
  input,
  prevCollector,
) {
  try {
    let forward_channel = item["channel"];
    const messages = await interaction.channel.messages.fetch({ limit: 5 });

    const hasImage = messages.find((msg) => {
      const hasAttachment = msg.attachments.some((att) =>
        att.contentType?.startsWith("image/"),
      );
      const hasUploadedVideo = msg.attachments.some((attachment) =>
        attachment.contentType?.startsWith("video/"),
      );

      const hasEmbeddedVideo = msg.embeds.some(
        (embed) => embed.video || embed.data.video,
      );
      const hasEmbed = msg.embeds.some((emb) => emb.image || emb.thumbnail);
      const notSelf = msg.author.id !== interaction.guild.members.me.id
      return (hasAttachment || hasEmbed || hasUploadedVideo || hasEmbeddedVideo) && notSelf;
    });
    let response;

    if (hasImage) {
      await interaction.deferUpdate();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("forward-yes")
          .setLabel("Yes")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("forward-cancel")
          .setLabel("No")
          .setStyle(ButtonStyle.Danger),
      );
      const disabledRow = new ActionRowBuilder().addComponents(
        actionRow.components.map((button) =>
          ButtonBuilder.from(button).setDisabled(true),
        ),
      );
      const embed = new EmbedBuilder()
        .setTitle("⚠️ Is this the correct proof of payment?")
        .setDescription(
        `- <:green:${emojis.green}> Click "Yes" to forward proof to receiver to ask for confirmation\n- <:red:${emojis.red}> Click "No" to resend correct proof`
      );
      response = await hasImage.reply({
        embeds: [embed],
        components: [row],
      });
      const filter = (i) =>
        interaction.user.id === i.user.id &&
        (i.customId === "forward-yes" || i.customId === "forward-cancel");

      const collector = response.createMessageComponentCollector({
        filter,
        time: 300_000,
      });

      collector.on("collect", async (i) => {
        const confirmRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`confirm-${item["id"]}-${input}`)
            .setLabel("Confirm")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`reject-${item["id"]}-${input}`)
            .setLabel("Reject")
            .setStyle(ButtonStyle.Danger),
        );
        const disabledRow = new ActionRowBuilder().addComponents(
          row.components.map((button) =>
            ButtonBuilder.from(button).setDisabled(true),
          ),
        );
        if (i.customId == "forward-yes") {
          try {
            await interaction.message.edit({
              components: [
                new ActionRowBuilder().addComponents(
                  actionRow.components.map((button) =>
                    ButtonBuilder.from(button).setDisabled(true),
                  ),
                ),
              ],
            });
            await prevCollector.stop();
            await i.deferReply();
            forward_channel = await interaction.client.channels.fetch(
              String(forward_channel),
            );
            const forwarded = await hasImage.forward(forward_channel);
            await forward_channel.send({
              // embeds: [
              //   new EmbedBuilder().setDescription(
              //     `<@${item["user_id"]}>, Do you confirm receiving this payment of \$${Number(input).toFixed(2)}?\n-# Note: If this image/video is unrelated to your exchange, notify mal asap as someone may be abusing the system.\n\nYour remaining balance would be \$${item["amount"] - item["pending"] - Number(input).toFixed(2)}`,
              //   ),
              // ],
              content: `<@${item["user_id"]}>, Do you confirm receiving this payment of \$${Number(input).toFixed(2)}?\n-# Note: If this image/video is unrelated to your exchange, notify mal asap as someone may be abusing the system.\n\nYour remaining balance would be \$${(item["amount"] - item["pending"] - Number(input)).toFixed(2)}`,
            });
            const confirm_msg = await i.editReply({
              embeds: [
                new EmbedBuilder()
                  .setAuthor({
                    name: `Your payment proof has been forwarded to the receiver to ask for confirmation.`,
                    iconURL: `https://cdn.discordapp.com/emojis/950076600869871676.webp?size=56`
                  }),
                new EmbedBuilder()
                  .setTitle(`<a:loading:${emojis.loading}>  Please wait for confirmation to get paid`)
                  .setDescription(`Send your crypto address and specify the coin you wanted\n> Ignore the buttons below (It is for Mal)`)
                  .setThumbnail("https://cdn.discordapp.com/attachments/853109872698982451/1530452978920587376/79ea6ffa1ca3345b59042a9ce9638dfc.gif?ex=6a65a0e8&is=6a644f68&hm=e98d52a9f5ba97466e72494f0217c254d7fc65ca65c2c8b446dc4e32c30c95f8&")
              ],
              content: `-# <@1474220722665558066> ||${forwarded.url}||`,
              components: [confirmRow]
            });
            await addMessage(Number(item.id), confirm_msg.url, i.user.id)
          } catch (error) {
            console.error(error);
            const confirmRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`confirm-${item["id"]}-${input}`)
                .setLabel("Confirm")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`reject-${item["id"]}-${input}`)
                .setLabel("Reject")
                .setStyle(ButtonStyle.Danger),
            );
            await i.reply({
              // embeds: [
              //   new EmbedBuilder().setDescription(
              //     "⚠️ Error occured while forwarding, please wait for <@1474220722665558066> to manually confirm.",
              //   ),
              // ],
              content:
                "⚠️ Error occured while forwarding, please wait for <@1474220722665558066> to manually confirm.",
            });
            await i.channel.send({
              // embeds: [
              //   new EmbedBuilder().setDescription(
              //     `<a:loading:${emojis.loading}> <@1474220722665558066> will review your exchange and pay you shortly. \n- Please send your crypto address and ignore the buttons below! (It is for Mal)`,
              //   ),
              // ],
              content: `<a:loading:${emojis.loading}> <@1474220722665558066> will review your exchange and pay you shortly. \n- Please send your crypto address and ignore the buttons below! (It is for Mal)`,
              components: [confirmRow],
            });
            await prevCollector.stop();
          }
        } else if (i.customId == "forward-cancel") {
          await i.reply({
            // embeds: [
            //   new EmbedBuilder().setDescription(
            //     `<a:loading:${emojis.loading}> Please send the correct proof of payment then click "Complete" again.`,
            //   ),
            // ],
            content: `<a:loading:${emojis.loading}> Please send the correct proof of payment then click "Complete" again.`,
          });
        }
        await i.message.edit({
          components: [disabledRow],
        });
      });
    } else {
      await interaction.reply({
        // embeds: [
        //   new EmbedBuilder().setDescription(
        //     'Image/Video has not been detected, please submit proof of payemnt before clicking "Complete"',
        //   ),
        // ],
        content:
          'Image/Video has not been detected, please submit proof of payemnt before clicking "Complete"',
        flags: MessageFlags.Ephemeral,
      });
    }
  } catch (e) {
    console.error(e);
  }
}

async function handleSendCancel(
  interaction,
  id,
  amount,
  actionRow,
  contentText,
  embed,
  collector,
) {
  const ok = await supabase.rpc(RPC, {
    p_id: Number(id),
    p_delta: -amount,
  });

  if (!ok.data) {
    await interaction.reply({
      content: "Could not release pending amount.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  await removeMessage(Number(id), interaction.user.id)
  await interaction.message.edit({
    components: [
      new ActionRowBuilder().addComponents(
        actionRow.components.map((button) =>
          ButtonBuilder.from(button).setDisabled(true),
        ),
      ),
    ],
  });
  await updateBoard(interaction);
  await interaction.reply({
    embeds: embed,
    content: contentText,
  });
  await collector.stop();
  return;
}

async function handleTOS(interaction, row, item, input) {
  const disabledRow = new ActionRowBuilder().addComponents(
    row.components.map((button) =>
      ButtonBuilder.from(button).setDisabled(true),
    ),
  );

  await interaction.update({
    components: [disabledRow],
  });

  if (interaction.customId === "tos-agree") {
    const ok = await supabase.rpc(RPC, {
      p_id: Number(item["id"]),
      p_delta: input,
    });

    if (!ok.data) {
      await interaction.followUp({
        content:
          "The exchange you attempted to claim is no longer available, please check <#1474045625510400104> for the updated amount and repeat the process if necessary.",
        ephemeral: true,
      });
      return;
    }

    await updateBoard(interaction);

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("send-complete")
        .setLabel("Complete")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("send-cancel")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("send-help")
        .setLabel("Need Help")
        .setStyle(ButtonStyle.Primary),
    );

    const calculatedAmount = item["amount"] - item["pending"];
    const amountMinusFee = (calculatedAmount * (100 - item["fee"])) / 100;

    const embed = new EmbedBuilder()
      .setDescription(
        `### Please send \$${input.toFixed(2)} to \`${item["info"]}\`
      <:8blackarrow:${emojis["8blackarrow"]}>  Send proof of payment below, then click "Complete"`,
      )
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/853109872698982451/1530447011503931563/bdb94f56d0ff74a8a3d1f2748d69921a_1.png?ex=6a659b59&is=6a6449d9&hm=8b4c308fc1184679271939af2188932c396a268e285ac4862190e9fc42720395&",
      )
      .setFooter({
        text: `${item["currency"]}: \$${calculatedAmount.toFixed(2)}${item["currency"] == "PayPal" ? (item["fnf"] == true ? " (cover fnf)" : " (minus fnf)") : ""} for \$${amountMinusFee.toFixed(2)}, ${item["fee"]}\% fee, min \$${item["min"]}`,
        iconURL: `https://cdn.discordapp.com/emojis/${emojis[item["currency"].toLowerCase()]}.webp`,
      });
    const response = await interaction.channel.send({
      // embeds: [embed],
      // content: `## <a:loading:${emojis.loading}> The exchange reservation will expire <t:${calculateTimeStamp(60 * 5)}:R>! \n-# ⚠️ Do not send if the reservation time has passed, otherwise you risk losing your funds.\n-# **${ORDER[item["currency"]]} ${item["currency"]}: \$${calculatedAmount.toFixed(2)}${item["currency"] == "PayPal" ? (item["fnf"] == true ? " (cover fnf)" : " (minus fnf)") : ""} for \$${amountMinusFee.toFixed(2)}, ${item["fee"]}\% fee, min \$${item["min"]}** \n\nPlease send $${input} to \`${item["info"]}\`. \n- Once paid, send proof of payment below, then click "Complete"`,
      content: `## <a:loading:${emojis.loading}> The exchange reservation will expire <t:${calculateTimeStamp(60 * 5)}:R>!\n-# ⚠️ Do not send if the reservation time has passed, otherwise you risk losing your funds.`,
      embeds: [embed],
      components: [actionRow],
    });

    const filter = (i) =>
      interaction.user.id === i.user.id &&
      (i.customId === "send-complete" ||
        i.customId === "send-cancel" ||
        i.customId === "send-help");

    const collector = response.createMessageComponentCollector({
      filter,
      time: 300_000,
    });

    collector.on("collect", async (i) => {
      const cancelContent = "Exchange cancelled";
      const helpContent =
        "State what you need help with and wait for <@1474220722665558066> to assist you. \n-# ⚠️ The exchange is no longer reserved, please do not send money otherwise you risk losing funds. If somehow you figured the problem out, you can repeat the claim process to reserve the exchange again.";
      switch (i.customId) {
        case "send-complete":
          // TODO FIX
          await handleSendComplete(i, actionRow, item, input, collector);
          break;
        case "send-cancel":
          await handleSendCancel(
            i,
            item["id"],
            input,
            actionRow,
            null,
            [cancelEmbed],
            collector,
          );
          break;
        case "send-help":
          await handleSendCancel(
            i,
            item["id"],
            input,
            actionRow,
            helpContent,
            null,
            collector,
          );
          break;
        default:
          break;
      }
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "time") {
        const timedOutRow = new ActionRowBuilder().addComponents(
          actionRow.components.map((button) =>
            ButtonBuilder.from(button).setDisabled(true),
          ),
        );

        const ok = await supabase.rpc(RPC, {
          p_id: Number(item["id"]),
          p_delta: -input,
        });

        await response
          .edit({
            components: [timedOutRow],
          })
          .catch(console.error);
        updateBoard(interaction);
        await response.reply({
          // embeds: [
          //   new EmbedBuilder().setDescription(
          //     "## ⚠️ Your 5-minute exchange reservation has expired. \nDo NOT send money past this point to the payment method because you risk losing your funds. \nIf you wish to still do the exchange, you can repeat the claiming process.",
          //   ),
          // ],
          content:
            "## ⚠️ Your 5-minute exchange reservation has expired. \nDo NOT send money past this point to the payment method because you risk losing your funds. \nIf you wish to still do the exchange, you can repeat the claiming process.",
          flags: MessageFlags.Ephemeral,
        });
      }
    });
  }
}

async function handleChannelDropdown(interaction, item, input) {
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
    // embeds: [embed],
    embeds: buildTOSMessage(item["currency"], input, interaction.user.id),
    components: [row],
    fetchReply: true
  });

  const filter = (i) => interaction.user.id === i.user.id;
  const newCollector = TOSResponse.createMessageComponentCollector({
    filter,
    time: 300_000,
  });

  newCollector.on("collect", async (i) => {
    await handleTOS(i, row, item, input);

    newCollector.stop();
  });

  newCollector.on("end", async (collected, reason) => {
    if (reason === "time") {
      const timedOutRow = new ActionRowBuilder().addComponents(
        row.components.map((button) =>
          ButtonBuilder.from(button).setDisabled(true),
        ),
      );

      await TOSResponse.edit({
        components: [timedOutRow],
      }).catch(console.error);
    }
  });

  await interaction.editReply({
    components: [],
  });
}

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      console.log(`Loaded command: ${command.data.name}`);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

client.once(Events.ClientReady, () => {
  console.log("Bot is online!");

  // Set debug presence if --debug flag is passed
  if (process.argv.includes("--debug")) {
    client.user.setPresence({
      activities: [
        {
          name: "Debugging",
          type: ActivityType.Custom,
          state: "🛠️ App in Construction",
        },
      ],
      status: "dnd",
    });
    client.user.setStatus("dnd");
    console.log("Debug mode enabled - presence set to debugging");
  } else {
    client.user.setPresence({
      activities: [
        {
          name: "Watching Mal's every action",
          type: ActivityType.Custom,
          state: "👀 Watching Mal's every action",
        },
      ],
      status: "online",
    });
    client.user.setStatus("online");
    console.log("Debug mode disabled - presence set to normal mode");
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isStringSelectMenu()) {
      switch (interaction.customId) {
        case "dropdown":
          const item = await getExchange(interaction.values[0]);
          const modal = buildTempModal(interaction.values[0], item);
          await interaction.showModal(modal);

          const oldComponent = interaction.component;

          const clearedMenu = new StringSelectMenuBuilder()
            .setCustomId(oldComponent.customId)
            .setPlaceholder(oldComponent.placeholder)
            .addOptions(
              oldComponent.options.map((opt) => ({
                label: opt.label,
                value: opt.value,
                emoji: opt.emoji || undefined,
              })),
            );

          const row = new ActionRowBuilder().addComponents(clearedMenu);

          await interaction.message.edit({
            components: [row],
          });
          break;
        case "select-channel":
          break;
        default:
          await interaction.deferReply();
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.includes("temp-popup")) {
        const item = await getExchange(interaction.customId.match(/\d+/gm)[0]);
        let input = parseFloat(
          interaction.fields.getTextInputValue("temp-input"),
        );

        if (isNaN(input)) {
          return await interaction.reply({
            content: "Please input a valid number!",
            flags: MessageFlags.Ephemeral,
          });
        }
        // if ((item.currency === "PayPal") &&
        //   (input < item.amount))

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
    }

    if (interaction.isButton()) {
      if (interaction.customId.includes("confirm")) {
        await interaction.deferReply({
          flags: MessageFlags.Ephemeral
        });
        if (!(await auth(interaction.user.id))) {
          return await interaction.reply({
            content: "Not Authorized",
            flags: MessageFlags.Ephemeral,
          });
        }
        try {
          const disabledRow = new ActionRowBuilder().addComponents(
            interaction.message.components[0].components.map((button) =>
              ButtonBuilder.from(button).setDisabled(true),
            ),
          );
          const matches = interaction.customId.match(CONFIRM_REGEX);
          if (matches.length <= 0) {
            return
          }
          const id = matches[0];
          const amount = matches[1];
          const item = await getExchange(Number(id));
          await removeMessage(Number(id), interaction.message.url);
          const user_id = await finalizeTemp(id, amount);
          const calculatedAmount = item["amount"] - item["pending"];
          const amountMinusFee = (calculatedAmount * (100 - item["fee"])) / 100;
          [result, oldBalanceRbx, oldBalanceUsd] = await editBalance(
            user_id,
            [],
            [-Number(amount)],
          );
          const user = await client.users.fetch(user_id);
          await appendUserHistory(user_id, "usd", [-Number(amount)]);
          try {
            const forward_channel = await interaction.client.channels.fetch(
              String(item["channel"]),
            );
            await forward_channel.send({
              // embeds: [
              //   new EmbedBuilder().setDescription(
              //     `**New Balance:** \$${result.balance_usd.toFixed(2)} USD, \$${result.balance_rbx.toFixed(2)} RBX\n-# :red_circle: Subtracted \$${Number(amount).toFixed(2)} from ${user ? user.username : ""}'s balance\n||-# (**Previous balance:** \$${oldBalanceUsd} USD${getUserInfo(result.info, FLAGS) !== "" ? `, ${getUserInfo(result.info, FLAGS)}` : ""})||`,
              //   ),
              // ],
              content: `**New Balance:** \$${result.balance_usd.toFixed(2)} USD, \$${result.balance_rbx.toFixed(2)} RBX\n-# :red_circle: Subtracted \$${Number(amount).toFixed(2)} from ${user ? user.username : ""}'s balance\n||-# (**Previous balance:** \$${oldBalanceUsd} USD${getUserInfo(result.info, FLAGS) !== "" ? `, ${getUserInfo(result.info, FLAGS)}` : ""})||`,
            });
          } catch {}
          await interaction.message.edit({
            components: [disabledRow],
          });
          await updateBoard(interaction);
          await interaction.editReply({
            content: "Done"
          })
          try {
            if (item.currency === "PayPal" && item.amount > 0) {
              item.fee += 1
            }
            await interaction.channel.send({
              embeds: [
                new EmbedBuilder().setDescription(
                  `\$${Number(amount).toFixed(2)}${item["currency"] == "PayPal" ? (item["fnf"] == true ? " (cover fnf)" : " (minus fnf)") : ""} ${item["currency"]} for \$${(Number(amount)*((100-item["fee"])/100)).toFixed(2)} Crypto, ${item["fee"]}% fee`
                )
                  .setAuthor({
                    name: "Receiver Confirmed",
                    iconURL: "https://cdn.discordapp.com/emojis/950076600869871676.webp?size=128"
                  })
              ],
              // content: "Finalized Transaction",
            });
            const logging = await getId(LOG);
            const channel = await interaction.client.channels.fetch(
              String(logging),
            );
            await channel.send({
              embeds: [buildSuccessContainer(item, amount)],
            });
          } catch (e) {
            console.log(e);
          }
        } catch (e) {
          console.log(e);
        }
      } else if (interaction.customId.includes("reject")) {
        if (!(await auth(interaction.user.id))) {
          return await interaction.reply({
            content: "Not Authorized",
            flags: MessageFlags.Ephemeral,
          });
        }
        await interaction.deferReply();
        const matches = interaction.customId.match(CONFIRM_REGEX);
        const id = matches[0];
        const amount = matches[1];
        const ok = await supabase.rpc(RPC, {
          p_id: Number(id),
          p_delta: -amount,
        });

        if (!ok.data) {
          return await interaction.editReply({
            content: "Reject Failed",
            flags: MessageFlags.Ephemeral,
          });
        }
        const disabledRow = new ActionRowBuilder().addComponents(
          interaction.message.components[0].components.map((button) =>
            ButtonBuilder.from(button).setDisabled(true),
          ),
        );
        await removeMessage(Number(id), interaction.message.url)
        await interaction.editReply({
          // embeds: [new EmbedBuilder().setDescription("Cancelled Transaction")],
          embeds: [cancelEmbed],
        });
        const item = await getExchange(Number(id));
        await interaction.message.edit({
          components: [disabledRow],
        });
        await updateBoard(interaction);
        try {
          const forward_channel = await interaction.client.channels.fetch(
            String(item["channel"]),
          );
          await forward_channel.send({
            content: `Your balance remains at \$${(item["amount"] - item["pending"]).toFixed(2)}`,
          });
        } catch {}
      } else {
        handleButtonInput(interaction)
      }

    }
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      const commandName = interaction.commandName.trim();

      if (adminCommands["AdminCommands"].includes(commandName)) {
        if (await auth(interaction.user.id)) {
          await runInteraction(command, interaction);
        } else {
          await interaction.reply({
            content: "There was an error while executing this command!",
            flags: MessageFlags.Ephemeral,
          });
        }
      } else if (adminCommands["PublicCommands"].includes(commandName)) {
        await runInteraction(command, interaction);
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
});

client.login(process.env.DISCORD_TOKEN);

async function runInteraction(command, interaction) {
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      flags: MessageFlags.Ephemeral,
    });
  }
}
