const { EmbedBuilder } = require("discord.js");

function getPitchName(pitchValue) {
	switch (pitchValue) {
		case 1.1:
			return "Low";
		case 1.25:
			return "Base";
		case 1.4:
			return "High";
		default:
			return "Custom";
	}
}

function createProfileEmbed(interaction, userData) {
	const embed = new EmbedBuilder()
		.setAuthor({
			name: "FumoTTS",
			iconURL: interaction.user.displayAvatarURL() ?? "",
		})
		.setTitle(`${interaction.user.displayName ?? "Unknown User"}'s Profile`)
		.addFields({
			name: "Settings",
			value: `Fumo voice: ${getPitchName(userData.pitch)} (pitch \`${userData.pitch}\`)`,
			inline: false,
		})
		.setTimestamp();

	return embed;
}

module.exports = {
	createProfileEmbed,
};
