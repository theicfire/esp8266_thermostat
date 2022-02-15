var mqtt = require("mqtt");
var fs = require("fs");
const path = require("path");
var logger = fs.createWriteStream(path.join(__dirname, "log.txt"), {
  flags: "a", // 'a' means appending (old data will be preserved)
});
var writeLine = (line) => logger.write(`\n${line}`);

var client = mqtt.connect("mqtt://143.110.233.56", {
  clientId: "temp_controller",
  username: "user",
  password: "pass",
  port: 2000,
});

class TempController {
  constructor() {
    this.lastOutletChange = new Date(0);
    this.isOutletOn = false;
    this.lastAboveLowThresh = new Date();
    this.lastBelowHighThresh = new Date();
    this.LOW_THRESH = 25;
    this.HIGH_THRESH = 27;
  }

  canChangeOutlet(curTime) {
    return this.lastOutletChange.getTime() < curTime - 30 * 60 * 1000;
  }

  update(temp, testTime) {
    const curTime = testTime ? testTime : new Date();
    if (temp >= this.LOW_THRESH) {
      this.lastAboveLowThresh = curTime;
    } else if (temp <= this.HIGH_THRESH) {
      this.lastBelowHighThresh = curTime;
    }

    if (temp < this.LOW_THRESH) {
      if (this.lastAboveLowThresh.getTime() < curTime - 60 * 1000) {
        if (this.canChangeOutlet(curTime)) {
          if (!testTime) {
            console.log("Outlet is now on");
          }
          this.isOutletOn = true;
          this.lastOutletChange = curTime;
        }
      }
    } else if (temp > this.HIGH_THRESH) {
      if (this.lastBelowHighThresh.getTime() < curTime - 60 * 1000) {
        if (this.canChangeOutlet(curTime)) {
          if (!testTime) {
            console.log("Outlet is now off");
          }
          this.isOutletOn = false;
          this.lastOutletChange = curTime;
        }
      }
    }
  }
}

const tempController = new TempController();

setInterval(() => {
  publish("outletState", {
    outlet_on: tempController.isOutletOn,
    v: "1",
  });
}, 10000);

client.on("message", function (topic, message, packet) {
  if (topic === "sensorState") {
    const msg = JSON.parse(message.toString());
    const tolog = `${new Date().toISOString()}, ${msg.deg_c}, ${msg.rh}`;
    tempController.update(msg.deg_c);
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

client.subscribe("sensorState", { qos: 1 });

function publish(topic, msg) {
  console.log("publishing", msg);

  var options = {
    retain: true, // TODO
    qos: 1, // TODO
  };
  client.publish(topic, JSON.stringify(msg), options);
}

function run_tests() {
  const tempController = new TempController();
  const DATE_START_MS = new Date(2020, 1, 1, 0, 0, 0).getTime();
  tempController.update(0, new Date(DATE_START_MS));
  tempController.update(40, new Date(DATE_START_MS));
  console.assert(tempController.isOutletOn === false, "a");
  tempController.update(10, new Date(DATE_START_MS + 70 * 1000));
  console.assert(tempController.isOutletOn === true, "b");
  tempController.update(40, new Date(DATE_START_MS + 200 * 1000));
  console.assert(tempController.isOutletOn === true, "c");
  tempController.update(40, new Date(DATE_START_MS + 32 * 60 * 1000));
  console.assert(tempController.isOutletOn === false, "d");
  console.log("Finished tests.");
}

run_tests();
// setInterval(function () {}, 10000);
