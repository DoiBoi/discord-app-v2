const { ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    LabelBuilder,
    ChannelSelectMenuBuilder,
    ActionRowBuilder
 } = require('discord.js');

function buildTempModal(id, item) {
    const amount = item["amount"] - item["pending"]
    const min = item["min"] > amount ? amount : item["min"]
    const max = amount

    const modal = new ModalBuilder()
        .setCustomId(`temp-popup-${id}`)
        .setTitle('Claim an Exchange')

    const input = new TextInputBuilder()
        .setCustomId('temp-input')
        .setPlaceholder('e.g. 10')
        .setStyle(TextInputStyle.Short)
    
    const label = new LabelBuilder()
        .setLabel("How much are you sending?")
        .setDescription(`Minimum: \$${min}, Maximum: \$${max}`)
        .setTextInputComponent(input);

    modal.addLabelComponents(label)

    return modal
}

function buildChannelDropdown() {
    const channelMenu = new ChannelSelectMenuBuilder()
        .setCustomId('select-channel')
        .setPlaceholder('Select channel...')

    const row = new ActionRowBuilder().addComponents(channelMenu);

    return row
}

module.exports = {
    buildTempModal,
    buildChannelDropdown
}