# Dialling in the Years


## Components

- Arduino Uno
- Grove 16x2 Display.
-   [Arduino Library](https://github.com/Seeed-Studio/Grove_LCD_RGB_Backlight)
- DFRobot Mini Mp3 Player
-   [Arduino Library](https://github.com/DFRobot/DFRobotDFPlayerMini/blob/master/examples/FullFunction/FullFunction.ino)
- Potentiometer
- 2 x 10k pull down resistors.
- Rotary Dial Phone
-   RJ11 Main Connection
-   RJ9 Headset




## Overview

### Hardware

The arduino connects to the dialler via an RJ11 cable. From this it senses the rotary encoder and hook state. A 100k pull down resistor is on this analog input pin.

To output audio, it connects via an RJ9 cable (using an RJ11 connector) to the handset. The audio is played back from the DFRobot Mini MP3 Player module, which is connected over i2c to be controlled by the Arduino.

There is also a serial 16x2 display. This shows state of the phone and numbers dialled so far.

A potentiometer is available for setting the volume of the music played through the handset.

There is an unused button with pulldown resistor on the circuit board not currently connected to any pin.

### Code

This describes the code in the main `dialler` sketch.

The dialler is read as an analog input every 10ms. This lets us sense if the handset is on the hook, and when it is off the hook we can count pulses made by dialling numbers.

Once 4 numbers are dialled, the song is requested from the mini mp3 player if it is within an accepted range. 

Otherwise it loops back to on-hook as a reset state.

The different states and pulses are detected based on expected ranges taken from a Northern Telecom rotary phone. They are found at the top of the file in case they need changing.

### Adding Songs

The SD Card contains songs in an MP3 directory. All songs must be named with 4 digits, between 0000.mp3 and 9999.mp3. 

At the moment the code does not have a good error state for playing unknown songs. I recommend sticking to songs between 2 dates, and adding code to show a good error message when a number outside that range is dialled.

### Changing the code for different phones

If the values do not appear to work for the phone connected, load the `debug` sketch and open the Arduino serial monitor to watch analog signals read from the phone.

Compare the values you see in the following states to the values in the `dialler` sketch:
- on hook should be 0 or close to.
- off hook should be close to 300. adjust the thresholds if different.
- When a number is dialled, the following pattern is expected:
    - high spike (600ish) (once per number dialled)
    - 0ish (once per number dialled)
    - a final high spike without a following 0 to show it is done.
If the high spike and 0ish are not as expected, change the values in code.
If this pattern is not seen, then the code will have to be changed to match the pattern seen on your phone. Hopefully it is sufficiently self-explanatory to make this easy.