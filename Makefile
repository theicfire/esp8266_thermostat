all:
	echo 'Pick a target'

upload:
	platformio run -t upload

monitor:
	pio device monitor -b 115200
