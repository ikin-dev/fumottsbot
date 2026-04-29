const { getData, saveData } = require("./jsonHandler.js");
const { pitches } = require("../tts/data.js");

// Load existing data or initialize new data
async function saveUserData(userId, username, pitch) {
	let data = await getData();
	if (!data) {
		data = { users: {}, stats: {} };
	}

	// overwrite user data in memory
	data.users[userId] = {
		username: username ? username : "unknown",
		pitch: pitch ? pitch : pitches.Base,
	};

	// save to file
	const success = await saveData(data);
	if (success) {
		console.log(
			"[USER DATA HANDLER] User data saved successfully:",
			data.users[userId].username,
		);
	}
}

async function getUserData(userId) {
	const data = await getData();
	if (data && data.users[userId]) {
		return data.users[userId];
	}
	return null;
}

module.exports = {
	saveUserData,
	getUserData,
};
