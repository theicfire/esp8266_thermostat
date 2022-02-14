var mqtt = require("mqtt");
var client = mqtt.connect("mqtt://143.110.233.56", {
  clientId: "client2",
  username: "user",
  password: "pass",
  port: 2000,
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

client.subscribe("home/bedroom/fan", { qos: 1 });
