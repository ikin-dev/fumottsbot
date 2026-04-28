const fs = require("fs").promises;
const path = require("path");
const dbPath = path.join(__dirname, "db.json");

async function getData() {
	try {
		const file = await fs.readFile(dbPath, "utf8");
		return JSON.parse(file);
	} catch (error) {
		console.error("[JSON HANDLER] Error reading data:", error);
		return null;
	}
}

async function saveData(data) {
	try {
		await fs.writeFile(dbPath, JSON.stringify(data, null, 2), "utf8");
		return true;
	} catch (error) {
		console.error("[JSON HANDLER] Error saving data:", error);
		return false;
	}
}

module.exports = {
	getData,
	saveData,
};
