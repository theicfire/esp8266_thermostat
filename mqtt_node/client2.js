var mqtt = require("mqtt");
var fs = require('fs');
var logger = fs.createWriteStream('log.txt', {
  flags: 'a' // 'a' means appending (old data will be preserved)
});
var writeLine = (line) => logger.write(`\n${line}`);

var client = mqtt.connect("mqtt://143.110.233.56", {
  clientId: "client2",
  username: "user",
  password: "pass",
  port: 2000,
});

client.on("message", function (topic, message, packet) {
	if (topic === 'outTopic') {
	  const msg = JSON.parse(message.toString());
	  console.log(msg);
	  const tolog = `${new Date().toISOString()}, ${msg.deg_c}, ${msg.rh}`;
	  console.log(tolog);
	  writeLine(tolog);
	} else {
	  console.log(`Unknown topic: ${topic}`);
	}
});

client.on("connect", function () {
  console.log("connected  " + client.connected);
});

client.on("error", function (error) {
  console.log("Error: " + error);
  process.exit(1);
});

client.subscribe("outTopic", { qos: 1 });
