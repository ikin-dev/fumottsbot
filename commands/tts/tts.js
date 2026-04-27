const { SlashCommandBuilder } = require("@discordjs/builders");
const { getCompressed } = require("../../tts/engine.js");
const { pitches } = require("../../tts/data.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tts")
    .setDescription("Convert text to fumo TTS as an audio file")
    .addStringOption((option) => option.setName("message").setDescription("Message to read out").setRequired(true))
    .addStringOption((option) => option.setName("pitch_name").setDescription("Name of pitch level").setChoices(
      { name: "Low", value: "Low" },
      { name: "Base", value: "Base" },
      { name: "High", value: "High" }
    ))
    .addNumberOption((option) => option.setName("custom_pitch").setDescription("Custom pitch level, overrides pitchName")),
    async execute(interaction) {
      const message = interaction.options.getString("message");
      const pitch = pitches[interaction.options.getString("pitch_name")] ?? interaction.options.getNumber("custom_pitch") ?? pitches.Base;
      const ogg = await getCompressed(message, pitch);
      await interaction.reply({
        files: [
          {
            attachment: ogg,
            name: "fumo.ogg"
          }
        ]
      });
    },
};
