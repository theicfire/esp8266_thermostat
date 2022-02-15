#include <Arduino.h>
#include <stdio.h>
#include <string.h>

#include "Adafruit_SHT4x.h"
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

constexpr int OUTLET_PIN = 14;
constexpr bool HAS_SENSOR = false;

constexpr int SENSOR_PUBLISH__MS = 10000;

const char *ssid = "Hummus (UJB) 2.4";
const char *password = "PlsNoTorrent";
const char *mqtt_server = "143.110.233.56";

WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;
unsigned long lastSensorRead = 0;
#define MSG_BUFFER_SIZE (200)
char msg[MSG_BUFFER_SIZE];

Adafruit_SHT4x sht4 = Adafruit_SHT4x();


void setup_wifi() {
  delay(10); // TODO not sure why

  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  randomSeed(micros());

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char *topic, byte *payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.println("] ");

  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();

  StaticJsonDocument<256> doc;

  DeserializationError error = deserializeJson(doc, payload, length);
  if (error) {
    Serial.print(F("deserializeJson() failed: "));
    Serial.println(error.f_str());
    return;
  }

  bool outlet_on = doc["outlet_on"];
  digitalWrite(OUTLET_PIN, outlet_on ? HIGH : LOW);
  //digitalWrite(LED_BUILTIN, outlet_on ? LOW : HIGH);
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Create a random client ID
    String clientId = HAS_SENSOR ? "ESP8266sensor-" : "ESP8266outlet-";
    clientId += String(random(0xffff), HEX);
    // Attempt to connect
    if (client.connect(clientId.c_str(), "user", "pass")) {
      Serial.println("connected");
      client.subscribe("outletState");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void setup_sensor() {
  if (!HAS_SENSOR) {
    return;
  }
  if (!sht4.begin()) {
    Serial.println("Couldn't find SHT4x");
    while (1)
      delay(1);
  }
  Serial.println("Found SHT4x sensor");
  Serial.print("Serial number 0x");
  Serial.println(sht4.readSerial(), HEX);

  // You can have 3 different precisions, higher precision takes longer
  sht4.setPrecision(SHT4X_HIGH_PRECISION);
  switch (sht4.getPrecision()) {
  case SHT4X_HIGH_PRECISION:
    Serial.println("High precision");
    break;
  case SHT4X_MED_PRECISION:
    Serial.println("Med precision");
    break;
  case SHT4X_LOW_PRECISION:
    Serial.println("Low precision");
    break;
  }

  // You can have 6 different heater settings
  // higher heat and longer times uses more power
  // and reads will take longer too!
  sht4.setHeater(SHT4X_NO_HEATER);
  switch (sht4.getHeater()) {
  case SHT4X_NO_HEATER:
    Serial.println("No heater");
    break;
  case SHT4X_HIGH_HEATER_1S:
    Serial.println("High heat for 1 second");
    break;
  case SHT4X_HIGH_HEATER_100MS:
    Serial.println("High heat for 0.1 second");
    break;
  case SHT4X_MED_HEATER_1S:
    Serial.println("Medium heat for 1 second");
    break;
  case SHT4X_MED_HEATER_100MS:
    Serial.println("Medium heat for 0.1 second");
    break;
  case SHT4X_LOW_HEATER_1S:
    Serial.println("Low heat for 1 second");
    break;
  case SHT4X_LOW_HEATER_100MS:
    Serial.println("Low heat for 0.1 second");
    break;
  }
}

void setup_mqtt() {
  pinMode(OUTLET_PIN, OUTPUT);
  //pinMode(LED_BUILTIN, OUTPUT);
  setup_wifi();
  client.setServer(mqtt_server, 2000);
  client.setCallback(callback);
}

void loop_sensor() {
  if (!HAS_SENSOR) {
    return;
  }
  unsigned long now = millis();
  if (now - lastSensorRead < SENSOR_PUBLISH__MS) {
    return;
  }
  lastSensorRead = now;
  sensors_event_t humidity, temp;

  uint32_t timestamp = millis();
  sht4.getEvent(&humidity, &temp); // populate temp and humidity objects with fresh data
  timestamp = millis() - timestamp;

  StaticJsonDocument<256> doc;

  doc["v"] = 1;
  doc["deg_c"] = temp.temperature;
  doc["rh"] = humidity.relative_humidity;
  memset(msg, 0, MSG_BUFFER_SIZE); // TODO is this needed?
  serializeJson(doc, msg, MSG_BUFFER_SIZE);
  Serial.print("Publish: ");
  Serial.println(msg);
  client.publish("sensorState", msg); // TODO what happens if the connection is bad?
}

void loop_mqtt() {
  if (!client.connected()) {
    reconnect(); // blocking, eww
  }
  client.loop();
}

void setup() {
  Serial.begin(115200);

  while (!Serial) {
    delay(10);
  }

  Serial.println("Begin setup");
  setup_sensor();
  setup_mqtt();
}

void loop() {
  loop_sensor();
  loop_mqtt();
}
