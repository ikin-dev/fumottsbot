const { Events } = require("discord.js");
const { saveUserData } = require("../db/userDataHandler.js");

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		
		// for testing jsonHandler, userDataHandler, and db.json
		// await saveUserData("6767676767", "testuser", "testvoice");
	},
};
