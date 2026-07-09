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
const { editBalance } = require("./utils/balance");
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
} = require("./commands/public/tempTrigger");

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

const CONFIRM_REGEX = /\d+\.\d+|\d+/gm;

async function handleSendComplete(interaction, actionRow, item, input) {
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
      await interaction.update({
        components: [disabledRow],
      });
      response = await interaction.channel.send({
        content: "Do you want to forward this to the sender?",
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
        if (i.customId == "forward-yes") {
          try {
            forward_channel = await interaction.client.channels.fetch(
              String(forward_channel),
            );
            const forwarded = await hasImage.forward(forward_channel);
            await i.reply({
              content: `Message sent in ${forwarded.url}, wait for <@1474220722665558066> to confirm`,
              components: [confirmRow],
            });
          } catch (error) {
            console.error(error);
            await i.reply({
              content: "Channel not found, ping mal to assist in forwarding",
              flags: MessageFlags.Ephemeral,
            });
          }
        } else if (i.customId == "forward-cancel") {
          await i.reply({
            content: "Please wait for <@1474220722665558066> to confirm",
            components: [confirmRow],
          });
        }
        const disabledRow = new ActionRowBuilder().addComponents(
          row.components.map((button) =>
            ButtonBuilder.from(button).setDisabled(true),
          ),
        );
        await i.message.edit({
          components: [disabledRow],
        });
      });
    } else {
      await interaction.reply({
        content: "Image not detected, please submit an image of the proof",
        flags: MessageFlags.Ephemeral,
      });
    }
  } catch (e) {
    console.error(e);
  }
}

async function handleSendCancel(interaction, id, amount, actionRow) {
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
    content: "Exchange cancelled",
  });
  return;
}

async function handleSendHelp(interaction) {
  await interaction.reply({
    content: "[PING MAL MESSAGE]",
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
        // TODO
        content: "[INSERT UNAVAILABLE MSG]",
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

    const response = await interaction.channel.send({
      content: `send ${input} to ${item["info"]}, Send proof \& click complete once done\n-# Buttons will be disabled after 5 minutes`,
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
      switch (i.customId) {
        case "send-complete":
          await handleSendComplete(i, actionRow, item, input);
          break;
        case "send-cancel":
          await handleSendCancel(i, item["id"], input, actionRow);
          break;
        case "send-help":
          await handleSendHelp(i);
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

        await response
          .edit({
            components: [timedOutRow],
          })
          .catch(console.error);
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
    // TODO
    content: "[INSERT MARKDOWN OF TOS]",
    components: [row],
  });

  const filter = (i) => interaction.user.id === i.user.id;
  const newCollector = TOSResponse.createMessageComponentCollector({
    filter,
    time: 300_000,
  });

  newCollector.on("collect", async (i) => {
    await handleTOS(i, row, item, input);
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
              "Please input a valid number (Please make sure that the amount you input is between the minimum & maximum that the exchange can do)",
            flags: MessageFlags.Ephemeral,
          });
        }

        const channelResponse = await interaction.reply({
          content:
            "Select the channel to do this exchange in\n-# Button will not work after 1 minute",
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
          // TODO: subtract amount from pending as well as balance
          //       then subtract amount from balances
          const item = await getExchange(Number(id));
          const forward_channel = await interaction.client.channels.fetch(
            String(item["channel"]),
          );
          const user_id = await finalizeTemp(id, amount);
          [result, oldBalanceRbx, oldBalanceUsd] = await editBalance(
            user_id,
            [],
            [-Number(amount)],
          );
          await interaction.reply({
            content: "Finalized Transaction",
          });
          await forward_channel.send({
            content: `<@${item["user_id"]}> New balance \$${result.balance_usd.toFixed(2)}`,
          });
          await interaction.message.edit({
            components: [disabledRow],
          });
          await updateBoard(interaction);
        } catch (e) {
          console.log(e);
        }
      } else if (interaction.customId.includes("reject")) {
        // TODO
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
        const forward_channel = await interaction.client.channels.fetch(
          String(item["channel"]),
        );
        await forward_channel.send({
          content: `<@${item["user_id"]}> New balance \$${(item["amount"] - item["pending"]).toFixed(2)}`,
        });
        await interaction.message.edit({
          components: [disabledRow],
        });
        await updateBoard(interaction);
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
