# Thermostat controller
Turn on/off a room heater based on the temperature of the room.

## Setup
### Equipment
- Two ESP8266's. I use the Wemos D1 Mini. A NodeMCU will also work. One measure temperatures, the other controls a heater. They could be the same device, but I found that I wanted them to be in different locations.
- [SHT40 temp/humidity sensor](https://www.adafruit.com/product/4885)
- An outlet power switch, like this [Powerswitch Tail 2](https://www.adafruit.com/product/268)

### Wiring
- Connect one ESP to the SHT40 -- power, ground, SDA, SCL (the default SDA/SCL of your microcontroller)
- Connect the other ESP to ground and D5.
### Programming
- Change the ip address to the correct broker
- Change the desired temperature range
- `make upload` on each of the ESP's. One with `HAS_SENSOR` to `true`, the other to `false`.
- Run the two node scripts in systemd


## Being a plumber is awesome.
It is said that certain programmers these days can be thought of as plumbers. That is, they don't create the tools they use, but instead just put the right pieces in the right places. This project is precisely one of those projects, and it's amazing how simple it was to put things together.

Here's what I'm using:

- esp8266
- Arduino library: Programming the esp8266 becomes as simple as normal Arduino code
- platformio -- Manages dependencies and allows me to build/program the ESP from the terminal
- Adafruit SHT4x Library -- talk to the temperature sensor
- ArduinoJson -- *excellent* library for using JSON in microcontrollers
- PubSubClient -- MQTT implementation for microcontrollers, like the ESP
- JS - aedes -- runs MQTT broker
- JS - mqtt -- runs MQTT client that runs a simple thermostat algorithm
- systemd to run the js services, manage logs, and restart them if they crash

## Show me some pictures
Here's the temperature of my room over the course of a day. I turn the heater off at night and back on in the morning, which is why it's so cold at the start.
<img width="907" alt="image" src="https://user-images.githubusercontent.com/442311/154426316-d118bc54-c2d4-4013-8398-4d924d146342.png">

