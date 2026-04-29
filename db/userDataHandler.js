const { getData, saveData } = require("./jsonHandler.js");

// Load existing data or initialize new data
async function saveUserData(userId, username, voice) {
	let data = await getData();
	if (!data) {
		data = { users: {}, stats: {} };
	}

	// overwrite user data in memory
	data.users[userId] = {
		username: username ? username : "unknown",
		voice: voice ? voice : "default",
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
