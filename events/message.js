const { Events } = require("discord.js");
const {
	getVoiceConnection,
	createAudioPlayer,
	createAudioResource,
	StreamType,
	AudioPlayerStatus,
} = require("@discordjs/voice");
const { getCompressed } = require("../tts/engine.js");
const { pitches } = require("../tts/data.js");
const { Readable } = require("node:stream");
const { getUserData } = require("../db/userDataHandler.js");

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		if (message.author.bot) return;

		const entry = this.ttsChannels.get(message.guildId);
		if (!entry || entry.textChannel !== message.channelId) return;

		const connection = getVoiceConnection(message.guildId);
		if (!connection) {
			this.ttsChannels.delete(message.guildId);
			return;
		}

		const userData = await getUserData(message.author.id);
		const pitch = userData ? userData.voice : pitches.Base; // if .voice doesn't exist return undefined
		const ogg = await getCompressed(message.content, pitch ?? pitches.Base); // if undefined, use base
		if (!ogg) {
			return;
		}

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
