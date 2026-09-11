const { MessageFlags } = require("discord.js")

async function handleEntriesAdd(interaction) {
  const rate = Number(interaction.fields.getTextInputValue('rate-input'))
  const entries = interaction.fields.getTextInputValue('entries-input').split("\n").map(
    (entry) => {
      const fields = entries.split("/")
      return {
        username: fields[0],
        amount: fields[1],
      }
    }
  )
  await interaction.reply({
    content: `${interaction.fields.getTextInputValue('entries-input')}, ${interaction.fields.getTextInputValue('rate-input')}`,
    flags: MessageFlags.Ephemeral
  })
  return
}

module.exports = {
  handleEntriesAdd
}
