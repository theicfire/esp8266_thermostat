var mqtt = require("mqtt");
var fs = require('fs');
var logger = fs.createWriteStream('log.txt', {
  flags: 'a' // 'a' means appending (old data will be preserved)
});
var writeLine = (line) => logger.write(`\n${line}`);

var client = mqtt.connect("mqtt://143.110.233.56", {
  clientId: "mqttjs01",
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

client.subscribe("outTopic", { qos: 1 }); //single topic

var options = {
  retain: true, // TODO
  qos: 1, // TODO
};

function publish(topic, msg, options) {
  console.log("publishing", msg);

  client.publish(topic, msg, options);
}

let count = 0;
setInterval(function () {
  publish(
    "inTopic",
    JSON.stringify({
      outlet_on: count % 2 == 0 ? true : false,
      v: "1",
      count: count,
    }),
    options
  );

  //publish(
    //"outTopic",
    //JSON.stringify({
      //v: "1",
      //deg_c: '22.2',
      //rh: '47.2',
    //}),
    //options
  //);
  count += 1;
}, 2000);
