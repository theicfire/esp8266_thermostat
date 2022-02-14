var mqtt = require("mqtt");
var client = mqtt.connect("mqtt://127.0.0.1", {
  clientId: "mqttjs01",
  username: "user",
  password: "pass",
  port: 1883,
});

client.on("message", function (topic, message, packet) {
  console.log(`message: ${message}, topic: ${topic}`);
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
  publish("inTopic", `test: ${count}`, options);
  count += 1;
}, 2000);
