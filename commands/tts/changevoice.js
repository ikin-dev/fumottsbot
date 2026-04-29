const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { pitches } = require("../../tts/data.js");
const { saveUserData } = require("../../db/userDataHandler.js");
const { execute } = require("./tts.js");
module.exports = {
	data: new SlashCommandBuilder()
		.setName("changevoice")
		.setDescription("Change the pitch your TTS voice")
		.addNumberOption((option) =>
			option
				.setName("preset")
				.setDescription("Name of pitch level")
				.setChoices(
					{ name: "Low", value: pitches.Low },
					{ name: "Base", value: pitches.Base },
					{ name: "High", value: pitches.High },
				),
		)
		.addNumberOption((option) =>
			option
				.setName("pitch")
				.setDescription("Custom pitch level, overrides preset")
				.setMinValue(0.1)
				.setMaxValue(3.0),
		),
	async execute(interaction, client) {
		const preset = interaction.options.getNumber("preset");
		const customPitch = interaction.options.getNumber("pitch");

		if (preset && customPitch !== null) {
			await interaction.reply({
				content:
					"You cannot use both a preset pitch and a custom pitch at the same time.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const pitch = customPitch ?? preset ?? pitches.Base;

		saveUserData(interaction.user.id, interaction.user.username, pitch);
		await interaction.reply({
			content: "Your TTS voice has been updated!",
			flags: MessageFlags.Ephemeral,
		});
	},
};
