const path = require("node:path");
const { spawn } = require("node:child_process");
const fs = require("node:fs");

const {
	alphabet,
	alphabetJP,
	symbols,
	silent,
	exclaim,
	repeat,
	aRepeat,
	iRepeat,
	uRepeat,
	eRepeat,
	oRepeat,
	smallToLarge,
} = require("./data.js");

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
		let char = message[i].toLowerCase();

		if (utf16 >= 0x30a1 && utf16 <= 0x30f6) {
			// Katakana to Hiragana
			char = String.fromCharCode(utf16 - 0x30a1 + 0x3041);
		}

		if (repeat.has(char)) {
			const lastChar = newMessage.at(-1);

			if (aRepeat.has(lastChar)) {
				char = "あ";
			} else if (iRepeat.has(lastChar)) {
				char = "い";
			} else if (uRepeat.has(lastChar)) {
				char = "う";
			} else if (eRepeat.has(lastChar)) {
				char = "え";
			} else if (oRepeat.has(lastChar)) {
				char = "お";
			} else if (lastChar === "ん") {
				char = "ん";
			}
		}

		newMessage += char;
	}

	return newMessage;
}

function tokenize(message) {
	const tokens = [];

	while (message.length) {
		let maxPrefix = "";
		for (const token of Object.keys(alphabetJP)) {
			if (token.length > maxPrefix.length && message.startsWith(token)) {
				maxPrefix = token;
			}
		}

		if (maxPrefix.length) {
			tokens.push(maxPrefix);
			message = message.slice(maxPrefix.length);
		} else {
			tokens.push(message[0]);
			message = message.slice(1);
		}
	}

	return tokens;
}

function normalizeTokens(tokens) {
	return tokens.map((tok) => {
		return smallToLarge[tok] ?? tok;
	});
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
	// SBF does not do the spacing
	if (alphabetJP[token] || token === "　") {
		//return isExclaim ? 140 : 100; // ms
		return 100; // ms
	}

	if (token === "っ") {
		//return isExclaim ? 200 : 160; // ms
		return 160; // ms
	}

	// Original wait is 50ms normal 70ms exclaim
	// Increased to compensate for Roblox task scheduler
	//return isExclaim ? 85 : 58; // ms
	return 58; // ms
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
	message = normalizeTokens(tokenize(normalize(message)));

	let nonSilent = false;

	for (let i = 0; i < message.length; i++) {
		if (!silent.has(message[i])) {
			nonSilent = true;
			break;
		}
	}

	if (!nonSilent) return null;

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

	return outBuf;
}

function getCompressed(
	message,
	pitch,
	log = false,
	outArgs = ["-f", "ogg", "-acodec", "libopus"],
) {
	return new Promise((resolve) => {
		const buffer = generate(message, pitch);
		if (!buffer) return resolve(null);

		const proc = spawn("ffmpeg", [
			"-f",
			`s${bitsPerSample}le`,
			"-ac",
			channels,
			"-ar",
			sampleRate,
			"-i",
			"-",
			...outArgs,
			"-",
		]);

		if (log) proc.stderr.on("data", (buf) => process.stderr.write(buf));
		proc.stdin.write(buffer);
		proc.stdin.end();

		let buf = Buffer.alloc(0);
		proc.stdout.on("data", (chunk) => (buf = Buffer.concat([buf, chunk])));
		proc.stdout.on("end", () => resolve(buf));
	});
}

module.exports = { generate, getCompressed };
