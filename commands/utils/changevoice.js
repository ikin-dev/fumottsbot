const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { saveUserData } = require("../../db/userDataHandler.js");
const { execute } = require("../tts/tts");
module.exports = {
	data: new SlashCommandBuilder()
		.setName("changevoice")
		.setDescription("Change the pitch your TTS voice")
		.addStringOption((option) =>
			option
				.setName("preset")
				.setDescription("Name of pitch level")
				.setChoices(
					{ name: "Low", value: "Low" },
					{ name: "Base", value: "Base" },
					{ name: "High", value: "High" },
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
		const preset = interaction.options.getString("preset");
		const customPitch = interaction.options.getNumber("pitch");

		if (preset && customPitch !== null) {
			await interaction.reply({
				content:
					"You cannot use both a preset pitch and a custom pitch at the same time.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const pitch = customPitch ?? preset ?? "default";

		saveUserData(interaction.user.id, interaction.user.username, pitch);
		await interaction.reply({
			content: "Your TTS voice has been updated!",
			flags: MessageFlags.Ephemeral,
		});
	},
};
