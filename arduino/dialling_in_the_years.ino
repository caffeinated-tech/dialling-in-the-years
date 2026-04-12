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
//  -  https://github.com/Seeed-Studio/Grove_LCD_RGB_Backlight
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

// used for scrolling long song name/artist texts oer the bottom lcd line.
int timeSinceLastScroll = -1000;
int scrollDelay = 1000;
int scrollOffset = 0;
// we only have songs from 1956 to 2000
// songs are stored under the year.mp3 files
// here are the corresponding song titles and artists to display.
int currentSong = 0;
char currentSongText[50];
size_t currentSongTextLength;
int offset = 1956;

// song titles take up too much space for memory, so had to follow this guide
// read this: https://docs.arduino.cc/language-reference/en/variables/utilities/PROGMEM/
#include <avr/pgmspace.h>
const char clear_song[] PROGMEM = "                                                                                                    ";
const char song_1956[] PROGMEM = "Don't be cruel - Elvis Presley   "; 
const char song_1957[] PROGMEM = "That's be the day - Buddy Holly and the Crickets   "; 
const char song_1958[] PROGMEM = "At the Hop - Danny and the Juniors   "; 
const char song_1959[] PROGMEM = "La Bamba - Ritchie Valens   "; 
const char song_1960[] PROGMEM = "The twist - Chubby Checker   "; 

const char *const songTitles[] PROGMEM = {
  song_1956,
  song_1957,
  song_1958,
  song_1959,
  song_1960, 
};


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
  Serial.println("started LCD ");
}

void loop() {
  delay(delayMs); 
  if (myDFPlayer.available()) {
    myDFPlayer.readType();
    myDFPlayer.read();
  }
  int phoneValue = analogRead(phoneInputPin);

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
    scrollSong();
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
  } else if (seenRisingEdgeAt > 0) {
    timesSeenAtZero = 0;
    if (phoneValue == 0) { 
      diallingNumber ++;
      seenRisingEdgeAt = 0;
    } else {
      unsigned long timeSinceLastRisingEdge = millis() - seenRisingEdgeAt; 
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
  currentSong = year.toInt();
  if (currentSong > 1955 && currentSong < 1961) { 
    Serial.println(currentSong); 
    strcpy_P(currentSongText, clear_song);
    strcpy_P(currentSongText, (char*)pgm_read_ptr(&(songTitles[currentSong - offset])));
    currentSongTextLength = strlen(currentSongText);
    Serial.println(currentSongText);
    Serial.println(currentSongTextLength);
    timeSinceLastScroll = -1000;
    scrollOffset = 0;
    lcd.clear();
    String playing = "Now Playing "  + String(currentSong) ; 
    Serial.println(playing);
    printToLCD(0, playing);
    printToLCD(1, currentSongText);
    mode = "playing";
    myDFPlayer.play(1);  
  } else {
    mode = "on-hook";
  }
}



void printToLCD(int row, String text){
  lcd.setCursor(0, row);
  lcd.print("                ");
  lcd.setCursor(0, row);
  lcd.print(text);
}

void scrollSong() {
  if (currentSongTextLength < 17) {
    return;
  }
  if (timeSinceLastScroll > scrollDelay) {
    if (scrollOffset == currentSongTextLength - 16) {
      scrollOffset = 0;
      timeSinceLastScroll = -1000;
    } else {
      scrollOffset += 1; 
    }  
    printToLCD(1, &(currentSongText[scrollOffset]));
    Serial.println(String(currentSongTextLength));
    Serial.println(&(currentSongText[scrollOffset]));
    timeSinceLastScroll = 0;
  } else {
    timeSinceLastScroll += 10;
  }
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