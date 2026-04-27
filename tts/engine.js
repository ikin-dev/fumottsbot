const path = require("node:path");
const { spawn } = require("node:child_process");
const fs = require("node:fs");

const { alphabet, alphabetJP, symbols, silent, exclaim } = require("./data.js");

const sampleDir = path.join(__dirname, "PCM");

const sampleRate = 48000;
const channels = 1;
const bitsPerSample = 16;
const bytesPerSample = bitsPerSample / 8;

const samplesPerMs = sampleRate / 1000;

const sampleCache = {};

function normalize(message) {
	let newMessage = "";

	for (let i = 0; i < message.length; i++) {
		const utf16 = message.charCodeAt(i);
		if (utf16 >= 0x30a1 && utf16 <= 0x30fa) {
			// Katakana to Hiragana
			newMessage += String.fromCharCode(utf16 - 0x30a1 + 0x3041);
		} else {
			newMessage += message[i].toLowerCase();
		}
	}

	return newMessage;
}

function tokenize(message) {
	const tokens = [];
	let tok = "";

	for (const char of message) {
		if (char === "ゃ" || char === "ゅ" || char === "ょ") {
			tok += char;
		} else {
			if (tok.length) tokens.push(tok);
			tok = char;
		}
	}

	if (tok.length) tokens.push(tok);

	return tokens;
}

function getFilename(letter) {
	return (
		alphabet[letter] ??
		alphabetJP[letter] ??
		symbols[Math.floor(Math.random() * symbols.length)]
	);
}

function getData(filename) {
	const fullPath = path.join(sampleDir, filename);

	let data = sampleCache[fullPath];

	if (!data) {
		data = fs.readFileSync(fullPath);
		sampleCache[fullPath] = data;
	}

	return data;
}

function duration(filename) {
	return getData(filename).length / bytesPerSample / channels;
}

function getSpacing(token, isExclaim) {
	if (alphabetJP[token] || token === "　") {
		return isExclaim ? 140 : 100; // ms
	}

	if (token === "っ") {
		return isExclaim ? 160 : 120; // ms
	}

	return isExclaim ? 70 : 50; // ms
}

function messageDuration(tokens, pitch, isExclaim) {
	let total = Math.ceil(duration(getFilename(tokens[0])) / pitch);

	for (const token of tokens.slice(1, -1)) {
		total += getSpacing(token, isExclaim) * samplesPerMs;
	}

	total += Math.ceil(duration(getFilename(tokens.at(-1))) / pitch);

	return total;
}

function generate(message, pitch) {
	message = tokenize(normalize(message));

	let nonSilent = false;

	for (let i = 0; i < message.length; i++) {
		if (!silent.has(message[i])) {
			nonSilent = true;
			break;
		}
	}

	if (!nonSilent) return;

	const isExclaim = exclaim.has(message.at(-1));
	if (isExclaim) pitch += 0.04;

	const durationSamples = messageDuration(message, pitch, isExclaim);

	const outBuf = Buffer.alloc(durationSamples * bytesPerSample * channels);

	let pos = 0;

	for (let i = 0; i < message.length; i++) {
		const token = message[i];

		if (silent.has(token)) {
			pos += getSpacing(token, isExclaim);
			continue;
		}

		const filename = getFilename(token);
		const data = getData(filename);

		const targetPitch = pitch + (Math.floor(Math.random() * 11) - 5) / 100;
		const targetDuration = duration(filename) / targetPitch;

		const insertPosition =
			Math.floor(pos * samplesPerMs) * bytesPerSample * channels;
		const bytesToInsert =
			Math.floor(targetDuration) * bytesPerSample * channels;

		for (let j = 0; j < bytesToInsert; j += bytesPerSample) {
			const readSample =
				Math.round((j * targetPitch) / bytesPerSample) * bytesPerSample;
			const readOut = insertPosition + j;

			if (readSample >= data.length || readOut >= outBuf.length) break;

			const sample1 = data.readInt16LE(readSample);
			const sample2 = outBuf.readInt16LE(readOut);

			outBuf.writeInt16LE(
				Math.min(Math.max(sample1 + sample2, -32767), 32767),
				insertPosition + j,
			);
		}

		pos += getSpacing(token, isExclaim);
	}

	const proc = spawn("ffmpeg", [
		"-f",
		`s${bitsPerSample}le`,
		"-ac",
		channels,
		"-ar",
		sampleRate,
		"-i",
		"-",
		"-f",
		"ogg",
		"-acodec",
		"libopus",
		"-",
	]);

	proc.stderr.on("data", (buf) => process.stderr.write(buf));
	proc.stdin.write(outBuf);
	proc.stdin.end();

	return proc.stdout;
}

function getCompressed(message, pitch) {
	return new Promise((resolve) => {
		const stream = generate(message, pitch);

		if (!stream) return resolve(null);

		let buf = Buffer.alloc(0);

		stream.on("data", (chunk) => (buf = Buffer.concat([buf, chunk])));
		stream.on("end", () => resolve(buf));
	});
}

module.exports = { getCompressed };
