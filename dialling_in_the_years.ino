// ------------------------------------------------------------------------------------
// Dialling In the Years.
// Project for Computer History Museum of Ireland Galway
//
//   An Arduino is connected to an old rotary dial phone to read dialled numbers and 
// play audio files matching the number dialled from an mp3 player module.
//
//
//  Components: 
//  -  https://wiki.dfrobot.com/dfplayer_mini_sku_dfr0299
//  -  
//
//
// ------------------------------------------------------------------------------------



#include <Wire.h>
#include "rgb_lcd.h"
rgb_lcd lcd;


#include "DFRobotDFPlayerMini.h"
#include <SoftwareSerial.h>
SoftwareSerial softSerial(/*rx =*/10, /*tx =*/11);
#define FPSerial softSerial
DFRobotDFPlayerMini myDFPlayer;


// connected to the phone rj11 cable.
int phoneInputPin = A0;

int phoneOffHookLowerThreshold = 580;
int phoneOffHookUpperThreshold = 650;

int phoneDiallingUpperEddge = 1000;
unsigned long seenRisingEdgeAt = 0;
int diallingNumber = 0;

// how many loops the input was between the off hook thresholds.
int timesSeenOffHook = 0;
// on hook is detected by repetitive times seen at 0
int timesSeenAtZero = 0;

int delayMs = 10;

unsigned long lastPulseTime = 0;
int pulses = 0;

String pulsed;
String dialled;

int previousPulses = 0;
String mode = "on-hook";
int pulsesUnder30 = 0;


String topLine = "";
String bottomLine = "";



void setup() {
  Serial.begin(115200);
  Serial.println("Dial a Year Program running...");
  lcd.begin(16, 2);
  showStartMessage();
  FPSerial.begin(9600);
  if (!myDFPlayer.begin(FPSerial, /*isACK = */true, /*doReset = */true)) {  //Use serial to communicate with mp3.
    Serial.println(F("Unable to begin:"));
    Serial.println(F("1.Please recheck the connection!"));
    Serial.println(F("2.Please insert the SD card!"));
  }
  setVolume();
}

void showStartMessage() {
  lcd.clear();
  printToLCD(0, "Lift the handset");
  printToLCD(1, "to begin.");
}

void loop() {
  delay(delayMs); 
  if (myDFPlayer.available()) {
    myDFPlayer.readType();
    myDFPlayer.read();
  }
  int phoneValue = analogRead(phoneInputPin);
//  Serial.println(phoneValue);
  if (mode == "on-hook") {
    if (phoneValue <= phoneOffHookLowerThreshold) {
      timesSeenOffHook = 0;
      return;
    } else if (phoneValue <= phoneOffHookUpperThreshold) {
      timesSeenOffHook++;
      if (timesSeenOffHook > 20) {
        mode = "off-hook";
        timesSeenOffHook = 0;
        lcd.clear();
        printToLCD(0, "Dial a year:");
      }
    }
      
  } else if (mode == "off-hook") {
      processDialler(phoneValue);
  } else if (mode == "playing") {
    if (phoneValue == 0 ){
      timesSeenAtZero++;
      if (timesSeenAtZero > 20) {
        mode = "on-hook";
        showStartMessage();
        timesSeenAtZero = 0;
        myDFPlayer.stop();  
      }
    } else {
      timesSeenAtZero = 0;
    }
  }
}


void setVolume() {
  int pot = analogRead(A1);
  int newVolume = (pot * 30 / 1024);
  Serial.println("Pot " + String(pot) + " volume " + String(newVolume));
  myDFPlayer.volume(newVolume);
}

void processDialler(int phoneValue) {
  if (seenRisingEdgeAt == 0 && phoneValue > phoneDiallingUpperEddge) {
    timesSeenAtZero = 0;
    seenRisingEdgeAt = millis();
//    Serial.println("seen rising edge at " + String(seenRisingEdgeAt));
  } else if (seenRisingEdgeAt > 0) {
    timesSeenAtZero = 0;
    if (phoneValue == 0) {
//      Serial.println("saw a zero ");
      diallingNumber ++;
      seenRisingEdgeAt = 0;
    } else {
      unsigned long timeSinceLastRisingEdge = millis() - seenRisingEdgeAt;
//      Serial.println("time since last edge " + String(timeSinceLastRisingEdge));
      if (diallingNumber > 0 && timeSinceLastRisingEdge > 100 ) {
        if (diallingNumber == 10) {
          diallingNumber = 0;
        }
        dialNumber(diallingNumber);
        diallingNumber = 0;
        seenRisingEdgeAt = 0; 
      }
    } 
  } else if (phoneValue == 0 ){
      timesSeenAtZero++;
      if (timesSeenAtZero > 20) {
        mode = "on-hook";
        showStartMessage();
        timesSeenAtZero = 0;
      }
  }
}

void dialNumber(int number) {
  dialled += String(number);
  printToLCD(1, dialled);
  Serial.println("dialled " + String(number));
  if (dialled.length() > 3) {
    playSong(dialled);
    dialled = "";
  }
}

void playSong(String year) {
  Serial.println("Play Song from " + year);
  int yearAsNumber = year.toInt();
  if (yearAsNumber > 1980 && yearAsNumber < 2026) {
      myDFPlayer.play(1);  
      lcd.clear();
      printToLCD(0, "Now Playing " + year);
      printToLCD(1, "Hang up to reset");
      mode = "playing";
  } else if (yearAsNumber > 1110 && yearAsNumber < 1120) {
      myDFPlayer.play(2);  
      lcd.clear();
      printToLCD(0, "Now Playing " + year);
      printToLCD(1, "Hang up to reset");
      mode = "playing";
  } else {
    mode = "on-hook";
  }
}


void printToLCD(int row, String text){
  lcd.setCursor(0, row); 
  lcd.print(text);
  lcd.print("                ");
}



void printDetail(uint8_t type, int value){
  switch (type) {
    case TimeOut:
      Serial.println(F("Time Out!"));
      break;
    case WrongStack:
      Serial.println(F("Stack Wrong!"));
      break;
    case DFPlayerCardInserted:
      Serial.println(F("Card Inserted!"));
      break;
    case DFPlayerCardRemoved:
      Serial.println(F("Card Removed!"));
      break;
    case DFPlayerCardOnline:
      Serial.println(F("Card Online!"));
      break;
    case DFPlayerUSBInserted:
      Serial.println("USB Inserted!");
      break;
    case DFPlayerUSBRemoved:
      Serial.println("USB Removed!");
      break;
    case DFPlayerPlayFinished:
      Serial.print(F("Number:"));
      Serial.print(value);
      Serial.println(F(" Play Finished!"));
      break;
    case DFPlayerError:
      Serial.print(F("DFPlayerError:"));
      switch (value) {
        case Busy:
          Serial.println(F("Card not found"));
          break;
        case Sleeping:
          Serial.println(F("Sleeping"));
          break;
        case SerialWrongStack:
          Serial.println(F("Get Wrong Stack"));
          break;
        case CheckSumNotMatch:
          Serial.println(F("Check Sum Not Match"));
          break;
        case FileIndexOut:
          Serial.println(F("File Index Out of Bound"));
          break;
        case FileMismatch:
          Serial.println(F("Cannot Find File"));
          break;
        case Advertise:
          Serial.println(F("In Advertise"));
          break;
        default:
          break;
      }
      break;
    default:
      break;
  }
  
}
