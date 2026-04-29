const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { getUserData } = require("../../db/userDataHandler.js");
const { createProfileEmbed } = require("../../embeds/profile.js");
module.exports = {
	data: new SlashCommandBuilder()
		.setName("profile")
		.setDescription("View your fumoTTS profile"),
	async execute(interaction) {
		const userData = await getUserData(interaction.user.id);
		if (!userData) {
			await interaction.reply({
				content:
					"You don't have a profile yet! Use /changevoice to set up your TTS voice.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		const profileEmbed = createProfileEmbed(interaction, userData);
		await interaction.reply({
			embeds: [profileEmbed],
		});
	},
};
