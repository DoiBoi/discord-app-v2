require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const adminCommands = require("./commands.json");
const { auth, supabase } = require("./utils/supabase/supabase_client.js");
const {
  getExchanges,
  getExchange,
  addToPending,
  finalizeTemp,
} = require("./utils/temp_exchage.js");
const { editBalance, getUserInfo } = require("./utils/balance");
const { getId } = require("./utils/id.js");
const { buildTempModal, buildChannelDropdown } = require("./utils/build.js");
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
} = require("discord.js");
const {
  buildDropdown,
  buildMessage,
  buildResponse,
  ORDER,
} = require("./commands/public/tempTrigger");
const { appendUserHistory } = require("./utils/history");

const FLAGS = {
  gfs_toggle: false,
  owe_toggle: false,
  info_toggle: true,
  new_line: false,
};

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
  switch (currency) {
    // TODO
    case "PayPal":
      return `<@${user}>\n## Please read the following message carefully. \nOnly once you are certain you can follow the instructions, click "I agree" \n__SCREEN RECORD THE SENDING & THE RECEIPT PAGE ON THE MOBILE APP__  \n\nMake sure your payments are** FNF, BALANCE AND USD** \n> If you send bank, card, gns payments and/or you don\'t screen record from mobile app, I will not release the crypto. \n Additionally, you must send the funds within 5 minutes, and if sent outside of your reserved duration, you risk losing your funds, so make sure you only claim an exchange when you are ready to send. \n \$${amount.toFixed(2)} of the Paypal exchange will be reserved for you for 5 minutes after pressing "I agree"`;
      break;
    case "CashApp":
      return `<@${user}>\n## Please read the following message carefully. \nOnly once you are certain you can follow the instructions, click "I agree" \n__SCREEN RECORD THE SENDING & THE RECEIPT PAGE ON THE MOBILE APP__ \n \nMust send with **CASH BALANCE** and **FOOD NOTE** \n> If you send bank, card and/or notes related to the exchange, I will not release the crypto. \n Additionally, you must send the funds within 5 minutes, and if sent outside of your reserved duration, you risk losing your funds, so make sure you only claim an exchange when you are ready to send. \n \$${amount.toFixed(2)} of the Cashapp exchange will be reserved for you for 5 minutes after pressing "I agree"`;
      break;
    case "Zelle":
      return `<@${user}>\n## Do you understand that you must send the funds within 5 minutes, and if sent outside of your reserved duration, you risk losing your funds? \nMake sure you only claim an exchange when you are ready to send. \n\$${amount.toFixed(2)} of the Zelle exchange will be reserved for you for 5 minutes after pressing "I agree"`;
      break;
    case "Venmo":
      return `<@${user}>\n## Do you understand that you must send the funds within 5 minutes, and if sent outside of your reserved duration, you risk losing your funds? \nMake sure you only claim an exchange when you are ready to send. \n\$${amount.toFixed(2)} of the Venmo exchange will be reserved for you for 5 minutes after pressing "I agree"`;
      break;
    default:
      return "";
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
      return hasAttachment || hasEmbed || hasUploadedVideo || hasEmbeddedVideo;
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
      response = await hasImage.reply({
        content:
          '⚠️ Is this the correct proof of payment? \n- Clicking "Yes" will forward it to the receiver to ask for confirmation \n- Clicking "No" allows you to resend the correct proof',
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
            forward_channel = await interaction.client.channels.fetch(
              String(forward_channel),
            );
            const forwarded = await hasImage.forward(forward_channel);
            await forward_channel.send({
              content: `<@${item["user_id"]}>, Do you confirm receiving this payment of \$${Number(input).toFixed(2)}?\n-# Note: If this image/video is unrelated to your exchange, notify mal asap as someone may be abusing the system.\n\nYour remaining balance would be \$${item["amount"] - item["pending"] - Number(input).toFixed(2)}`,
            });
            await i.reply({
              content: `✅ Your payment proof has been forwarded to the receiver to ask for confirmation. ||${forwarded.url}|| \n \n <a:loading:1524945258998399063> <@1474220722665558066> will review your exchange and pay you shortly. \n- Please send your crypto address and ignore the buttons below! (It is for Mal)`,
              components: [confirmRow],
            });
          } catch (error) {
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
              content:
                "⚠️ Error occured while forwarding, please wait for <@1474220722665558066> to manually confirm.",
            });
            await i.channel.send({
              content:
                "<a:loading:1524945258998399063> <@1474220722665558066> will review your exchange and pay you shortly. \n- Please send your crypto address and ignore the buttons below! (It is for Mal)",
              components: [confirmRow],
            });
          }
        } else if (i.customId == "forward-cancel") {
          await i.reply({
            content:
              '<a:loading:1524945258998399063> Please send the correct proof of payment then click "Complete" again.',
          });
        }
        await i.message.edit({
          components: [disabledRow],
        });
      });
    } else {
      await interaction.reply({
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
  collector,
) {
  const ok = await supabase.rpc("update_temp_pending", {
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
    content: contentText,
  });
  await collector.stop();
  return;
}

async function handleSendHelp(interaction, id, amount, actionRow) {
  await interaction.reply({
    content:
      "State what you need help with and wait for <@1474220722665558066> to assist you. \n-# ⚠️ The exchange is no longer reserved, please do not send money otherwise you risk losing funds. If somehow you figured the problem out, you can repeat the claim process to reserve the exchange again.",
  });
  return;
}

async function updateBoard(interaction) {
  let channel, message;
  const channel_id = await getId("channel_id");
  const message_id = await getId("message_id");

  try {
    channel = await interaction.client.channels.fetch(String(channel_id));
  } catch {}

  try {
    message = await channel.messages.fetch(String(message_id));
  } catch {}
  const exchanges = await getExchanges();
  const hasExchanges = Object.values(exchanges).some((items) =>
    items.some(
      (item) => Math.round((item.amount - item.pending) * 100) / 100 > 0,
    ),
  );

  const dropdown = hasExchanges ? buildDropdown(exchanges) : null;
  const dropdownRow = dropdown
    ? [new ActionRowBuilder().addComponents(dropdown)]
    : [];

  await message.edit({
    content: buildResponse(exchanges),
    components: dropdownRow,
  });
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
    const ok = await supabase.rpc("update_temp_pending", {
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

    const response = await interaction.channel.send({
      content: `## <a:loading:1524945258998399063> The exchange reservation will expire <t:${calculateTimeStamp(60 * 5)}:R>! \n-# ⚠️ Do not send if the reservation time has passed, otherwise you risk losing your funds.\n-# **${ORDER[item["currency"]]} ${item["currency"]}: \$${calculatedAmount.toFixed(2)}${item["currency"] == "PayPal" ? (item["fnf"] == True ? " (cover fnf)" : " (minus fnf)") : ""} for \$${amountMinusFee.toFixed(2)}, ${item["fee"]}\% fee, min \$${item["min"]}** \n\nPlease send $${input} to \`${item["info"]}\`. \n- Once paid, send proof of payment below, then click "Complete"`,
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
            cancelContent,
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

        const ok = await supabase.rpc("update_temp_pending", {
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
    content: buildTOSMessage(item["currency"], input, interaction.user.id),
    components: [row],
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
    }

    if (interaction.isButton()) {
      if (interaction.customId.includes("confirm")) {
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
          const id = matches[0];
          const amount = matches[1];
          const item = await getExchange(Number(id));
          const user_id = await finalizeTemp(id, amount);
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
              content: `**New Balance:** \$${result.balance_usd.toFixed(2)} USD, \$${result.balance_rbx.toFixed(2)} RBX\n-# :red_circle: Subtracted \$${Number(amount).toFixed(2)} from ${user ? user.username : ""}'s balance\n||-# (**Previous balance:** \$${oldBalanceUsd} USD${getUserInfo(result.info, FLAGS) !== "" ? `, ${getUserInfo(result.info, FLAGS)}` : ""})||`,
            });
          } catch {}
          await interaction.message.edit({
            components: [disabledRow],
          });
          await updateBoard(interaction);
          try {
            await interaction.channel.send({
              content: "Finalized Transaction",
            });
          } catch {}
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
        const matches = interaction.customId.match(CONFIRM_REGEX);
        const id = matches[0];
        const amount = matches[1];
        const ok = await supabase.rpc("update_temp_pending", {
          p_id: Number(id),
          p_delta: -amount,
        });

        if (!ok.data) {
          return await interaction.reply({
            content: "Reject Failed",
            flags: MessageFlags.Ephemeral,
          });
        }
        const disabledRow = new ActionRowBuilder().addComponents(
          interaction.message.components[0].components.map((button) =>
            ButtonBuilder.from(button).setDisabled(true),
          ),
        );
        await interaction.reply({
          content: "Cancelled Transaction",
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
    console.error(error.message);
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
