const { SlashCommandBuilder } = require("@discordjs/builders");
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("leave")
		.setDescription("Leave the voice channel"),
	async execute(interaction, client) {
		const connection = getVoiceConnection(interaction.guildId);
		if (connection) {
			connection.destroy();
		}

		client.ttsChannels.delete(interaction.guildId);

		interaction.reply("Bye");
	},
};
