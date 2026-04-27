const { Events } = require('discord.js');
const { getVoiceConnection, createAudioPlayer, createAudioResource, StreamType, AudioPlayerStatus } = require("@discordjs/voice");
const { getCompressed } = require("../tts/engine.js");
const { pitches } = require("../tts/data.js");
const { Readable } = require("node:stream");

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		const entry = this.ttsChannels.get(message.guildId);
		if (!entry || entry.textChannel !== message.channelId) return;

		const connection = getVoiceConnection(message.guildId);
		if (!connection) {
			this.ttsChannels.delete(message.guildId);
			return;
		}

		const ogg = await getCompressed(message.content, pitches.Base);
		const resource = createAudioResource(Readable.from(ogg), {
			inputType: StreamType.OggOpus,
		});

		const player = createAudioPlayer();
		let subscription;
		player.on(AudioPlayerStatus.Idle, () => {
			player.stop();
			if (subscription) subscription.unsubscribe();
		});
		player.play(resource);

		subscription = connection.subscribe(player);
		if (!subscription) {
			// Connection dead
			player.stop();
			this.ttsChannels.delete(message.guildId);
		}
	},
};
