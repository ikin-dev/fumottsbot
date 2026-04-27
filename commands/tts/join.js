const { SlashCommandBuilder } = require("@discordjs/builders");
const { joinVoiceChannel } = require("@discordjs/voice");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("join")
		.setDescription(
			"Join voice channel and start playing TTS for the given channel",
		)
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription("Channel to subscribe to")
				.setRequired(true),
		),
	async execute(interaction, client) {
		// https://stackoverflow.com/a/66566442
		const guild = await client.guilds.fetch(interaction.guildId);
		const member = await guild.members.fetch(interaction.member.id);
		const voiceChannel = member.voice.channel;
		const textChannel = interaction.options.getChannel("channel").id;

		joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guild.id,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
		});

		client.ttsChannels.set(voiceChannel.guild.id, {
			textChannel,
			voiceChannel: voiceChannel.id,
		});

		interaction.reply(`Joined ${voiceChannel}, bound to <#${textChannel}>`);
	},
};
