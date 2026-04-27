const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("sayfumo")
		.setDescription("Says FUMO!!!!"),
	async execute(interaction) {
		await interaction.reply("FUMO!!!!");
	},
};
