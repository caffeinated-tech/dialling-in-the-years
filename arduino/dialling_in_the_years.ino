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
#include <AltSoftSerial.h>
AltSoftSerial softSerial(/*rx =*/8, /*tx =*/9);
#define FPSerial softSerial
DFRobotDFPlayerMini myDFPlayer;


// connected to the phone rj11 cable.
int phoneInputPin = A0;

int phoneOffHookLowerThreshold = 580;
int phoneOffHookUpperThreshold = 1100;

int phoneDiallingUpperEdge = 800;
int phoneDiallingLowerEdge = 300;
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
unsigned long timeTakenOffHook = 0;
int previousPulses = 0;
String mode = "on-hook";
int pulsesUnder30 = 0;


String topLine = "";
String bottomLine = "";

// used for scrolling long song name/artist texts oer the bottom lcd line.
int timeSinceLastScroll = -1000;
int scrollDelay = 2000;
int scrollOffset = 0;
// we only have songs from 1956 to 2000
// songs are stored under the year.mp3 files
// here are the corresponding song titles and artists to display.
int currentSong = 0;
char currentSongText[50];
size_t currentSongTextLength;
int offset = 1955;

// song titles take up too much space for memory, so had to follow this guide
// read this: https://docs.arduino.cc/language-reference/en/variables/utilities/PROGMEM/
#include <avr/pgmspace.h>
const char clear_song[] PROGMEM = "                                                                                              ";
const char song_1955[] PROGMEM = "Rock around the clock - Bill Haley & the Comets";
const char song_1956[] PROGMEM = "Heartbreak Hotel - Elvis Presley   "; 
const char song_1957[] PROGMEM = "At the Hop - Danny and the Juniors   "; 
const char song_1958[] PROGMEM = "Heartbreak/All I have to do... - Buddy Holly/Every Brothers   "; 
const char song_1959[] PROGMEM = "Donna - Ritchie Valens   "; 

const char song_1960[] PROGMEM = "Will you still love me tomorrow - The Shirelles   "; 
const char song_1961[] PROGMEM = "Poetry in Motion - Johnny Tillotson   "; 
const char song_1962[] PROGMEM = "Save the last Dance for Me - Drifters   "; 
const char song_1963[] PROGMEM = "She Loves You - Beatles   "; 
const char song_1964[] PROGMEM = "Downtown - Petula Clark   "; 
const char song_1965[] PROGMEM = "I Got You Babe - Sonny & Cher   "; 
const char song_1966[] PROGMEM = "Good Vibrations - Beach Boys   "; 
const char song_1967[] PROGMEM = "Black Velvet Band - The Dubliners   "; 
const char song_1968[] PROGMEM = "Those Were The Days - Mary Hopkins   "; 
const char song_1969[] PROGMEM = "Bad Moon Rising - Credence Clearwater Revival   ";
 
const char song_1970[] PROGMEM = "Woodstock - Matthes Southern Comfort   "; 
const char song_1971[] PROGMEM = "Sweet Caroline - Neil Diamond   "; 
const char song_1972[] PROGMEM = "Telegram Sam/Metal Guru - T Rex   "; 
const char song_1973[] PROGMEM = "Whiskey in the Jar - Thin Lizzy   "; 
const char song_1974[] PROGMEM = "Waterloo - Abba   "; 
const char song_1975[] PROGMEM = "Harvest for the World - Isley Brothers   "; 
const char song_1976[] PROGMEM = "I Don't Want to Talk About it - Rod Stewart   "; 
const char song_1977[] PROGMEM = "Staying Alive - Bee Gees   "; 
const char song_1978[] PROGMEM = "YMCA - Village People   "; 
const char song_1979[] PROGMEM = "I will Survive - Gloria Gaynor   "; 

const char song_1980[] PROGMEM = "Stand Up for your Love - Bob Marley   "; 
const char song_1981[] PROGMEM = "Kids in America - Kim Wilde   "; 
const char song_1982[] PROGMEM = "Theme from Harry's Game - Clannad   "; 
const char song_1983[] PROGMEM = "Flashdance - Irene Cara   "; 
const char song_1984[] PROGMEM = "99 Red Balloons - Nena   "; 
const char song_1985[] PROGMEM = "In a Lifetime - Clannad & Bono   "; 
const char song_1986[] PROGMEM = "A Good Hear - Fergal Sharkey   "; 
const char song_1987[] PROGMEM = "With or Without You - U2   "; 
const char song_1988[] PROGMEM = "Perfect - Fairground Attraction   "; 
const char song_1989[] PROGMEM = "Love Shack - B52s   "; 

const char song_1990[] PROGMEM = "Put them under Pressure - Republic of Ireland Football Squad   "; 
const char song_1991[] PROGMEM = "Brewing up a Storm - The Stunning`                 "; 
const char song_1992[] PROGMEM = "It's My Life - Dr. Alban   "; 
const char song_1993[] PROGMEM = "Mr. Vain - Culture Beat   "; 
const char song_1994[] PROGMEM = "Circle of Life - Elton John   "; 
const char song_1995[] PROGMEM = "The Foggy Dew - Chieftans & Sinead O' Connor   "; 
const char song_1996[] PROGMEM = "Gabrielle - Walk on By   "; 
const char song_1997[] PROGMEM = "Freed From Desire - Gala   "; 
const char song_1998[] PROGMEM = "Brimful of Asha - Cornershop / Norman Cook Mix   "; 
const char song_1999[] PROGMEM = "Praise You - Fatboy Slim   "; 
const char song_2000[] PROGMEM = "Groovejet (If this Ain't Love) - Spiller with Sophie Ellis-Bextor   "; 

const char *const songTitles[] PROGMEM = {
  song_1955,
  song_1956,
  song_1957,
  song_1958,
  song_1959,
  song_1960, 
  song_1961, 
  song_1962, 
  song_1963, 
  song_1964, 
  song_1965, 
  song_1966, 
  song_1967, 
  song_1968, 
  song_1969, 
  song_1970, 
  song_1971, 
  song_1972, 
  song_1973, 
  song_1974, 
  song_1975, 
  song_1976, 
  song_1977, 
  song_1978, 
  song_1979, 
  song_1980, 
  song_1981, 
  song_1982, 
  song_1983, 
  song_1984, 
  song_1985, 
  song_1986, 
  song_1987, 
  song_1988, 
  song_1989, 
  song_1990, 
  song_1991, 
  song_1992, 
  song_1993, 
  song_1994, 
  song_1995, 
  song_1996, 
  song_1997, 
  song_1998, 
  song_1999, 
  song_2000, 
};


void setup() {
  Serial.begin(9600);
  Serial.println("Dial a Year Program running...");
  delay(5000); 
  lcd.begin(16, 2);
  delay(1000); 
  FPSerial.begin(9600);
  if (!myDFPlayer.begin(FPSerial, /*isACK = */false, /*doReset = */true)) { 
    Serial.println(F("Unable to begin:"));
    Serial.println(F("1.Please recheck the connection!"));
    Serial.println(F("2.Please insert the SD card!"));
  }
  delay(1000); 
  myDFPlayer.outputDevice(DFPLAYER_DEVICE_SD);
  setVolume();
  showStartMessage();
}

void showStartMessage() {
  lcd.clear();
  printToLCD(0, "Lift the handset");
  printToLCD(1, "to begin.");
//  Serial.println("started LCD ");
}

void loop() {
  delay(delayMs); 
  if (myDFPlayer.available()) { 
    myDFPlayer.readType();
    myDFPlayer.read();
  }
  int phoneValue = analogRead(phoneInputPin);
  //  printToLCD(1, String(phoneValue)); 
  if (mode == "on-hook") {
    if (phoneValue <= phoneOffHookLowerThreshold) {
      timesSeenOffHook = 0;
      return;
    } else if (phoneValue <= phoneOffHookUpperThreshold) {
      timesSeenOffHook++;
      if (timesSeenOffHook > 20) {
        timeTakenOffHook = millis();
        mode = "off-hook";
        timesSeenOffHook = 0;
        dialled = "";
        lcd.clear();
        printToLCD(0, "Dial a year:");
        Serial.println("dial a year");
        myDFPlayer.stop();  
      }
    }
      
  } else if (mode == "off-hook") {
      processDialler(phoneValue);
  } else if (mode == "playing") {
    scrollSong(); 
    if (phoneValue < 10 ){
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
//  int pot = analogRead(A1);
//  int newVolume = (pot * 30 / 1024);
//  Serial.println("Pot " + St  ring(pot) + " volume " + String(newVolume));
  myDFPlayer.volume(12);
}

void processDialler(int phoneValue) {
    Serial.println(String(phoneValue));
  if (seenRisingEdgeAt == 0 && phoneValue > phoneDiallingUpperEdge) {
    timesSeenAtZero = 0;
    seenRisingEdgeAt = millis(); 
  } else if (seenRisingEdgeAt > 0) {
    timesSeenAtZero = 0;
    if (phoneValue < phoneDiallingLowerEdge) { 
      diallingNumber ++;
      seenRisingEdgeAt = 0;
    } else {
      unsigned long timeSinceLastRisingEdge = millis() - seenRisingEdgeAt;
      if (diallingNumber > 0 && timeSinceLastRisingEdge > 100 ) {
        if (diallingNumber == 10) {
          diallingNumber = 0;
        }
        // taking the handset of the hook is the same signal as dialling a 1. If this dial
        //  happened right after taking off the hook, ignore it.
        if (millis() - timeTakenOffHook > 500) {
          dialNumber(diallingNumber); 
        }
        diallingNumber = 0;
        seenRisingEdgeAt = 0; 
      }
    } 
  } else if (phoneValue < phoneDiallingLowerEdge ){
    timesSeenAtZero++;
    if (timesSeenAtZero > 20) {
      mode = "on-hook";
      showStartMessage();
      timesSeenAtZero = 0;
    }
  }
}

// Add a number to the list of dialled numbers.
// Once 4 numbers have been dialled, try playing the song for that year.
void dialNumber(int number) {
  Serial.println("dialled "+number);
  dialled += String(number);
  printToLCD(1, dialled);
  if (dialled.length() > 3) {
    playSong(dialled);
    dialled = "";
  }
}

// Play a song for a given dialled year "1955" to "2000"
// This will both play the song from the corresponding century folder, and scroll the name 
//   of the song on the 2nd line of the display.
void playSong(String year) {
  Serial.println("Play Song from " + year);
  currentSong = year.toInt();
  if (currentSong > 1954 && currentSong < 2001) {  
    strcpy_P(currentSongText, clear_song);
    strcpy_P(currentSongText, (char*)pgm_read_ptr(&(songTitles[currentSong - offset])));
    currentSongTextLength = strlen(currentSongText);
    Serial.println(currentSongText); 
    timeSinceLastScroll = -1000;

    scrollOffset = 0;
    printToLCD(1, currentSongText);
    String playing = "Now Playing "  + String(currentSong) ; 
    printToLCD(0, playing);
    mode = "playing"; 
    
    // Thanks to https://forum.arduino.cc/t/dfplayermini-mp3-player-my-experience/1210000
    //   we know that playing songs from numbered folders is reliable. 
    //   Playing from the mp3 folder is in order of creation date, not name.mp3
    // Songs for 1900-1999 are in folder 19, numbered 055 to 099
    // Songs for 2000+ are in folder 20, at the moment there's only file 000 for year 2000.
    if (currentSong < 2000) {   
      Serial.println("play from folder 19"); 
      Serial.println(currentSong-1900); 
      myDFPlayer.playFolder(19, currentSong - 1900); 
    } else {
      Serial.println("play from folder 20"); 
      Serial.println(currentSong-2000);
      myDFPlayer.playFolder(20, currentSong - 2000);   
    } 
  } else {
    mode = "on-hook";
  }
}



void printToLCD(int row, String text){
  lcd.setCursor(0, row);
  lcd.print("                ");
  lcd.setCursor(0, row);
  lcd.print(text);
  
  delay(50);   // let I2C settle
}

void scrollSong() {
  if (currentSongTextLength < 17) {
    return;
  }
  if (timeSinceLastScroll > scrollDelay) {
    if (scrollOffset == currentSongTextLength - 16) {
      scrollOffset = 0;
      timeSinceLastScroll = -2000;
    } else {
      scrollOffset += 1; 
    }  
    printToLCD(1, &(currentSongText[scrollOffset])); 
    String playing = "Now Playing "  + String(currentSong) ; 
    printToLCD(0, playing);
    timeSinceLastScroll = 0;
  } else {
    timeSinceLastScroll += 10;
  }
}



//void printDetail(uint8_t type, int value){
//  switch (type) {
//    case TimeOut:
//      Serial.println(F("Time Out!"));
//      break;
//    case WrongStack:
//      Serial.println(F("Stack Wrong!"));
//      break;
//    case DFPlayerCardInserted:
//      Serial.println(F("Card Inserted!"));
//      break;
//    case DFPlayerCardRemoved:
//      Serial.println(F("Card Removed!"));
//      break;
//    case DFPlayerCardOnline:
//      Serial.println(F("Card Online!"));
//      break;
//    case DFPlayerUSBInserted:
//      Serial.println("USB Inserted!");
//      break;
//    case DFPlayerUSBRemoved:
//      Serial.println("USB Removed!");
//      break;
//    case DFPlayerPlayFinished:
//      Serial.print(F("Number:"));
//      Serial.print(value);
//      Serial.println(F(" Play Finished!"));
//      break;
//    case DFPlayerError:
//      Serial.print(F("DFPlayerError:"));
//      switch (value) {
//        case Busy:
//          Serial.println(F("Card not found"));
//          break;
//        case Sleeping:
//          Serial.println(F("Sleeping"));
//          break;
//        case SerialWrongStack:
//          Serial.println(F("Get Wrong Stack"));
//          break;
//        case CheckSumNotMatch:
//          Serial.println(F("Check Sum Not Match"));
//          break;
//        case FileIndexOut:
//          Serial.println(F("File Index Out of Bound"));
//          break;
//        case FileMismatch:
//          Serial.println(F("Cannot Find File"));
//          break;
//        case Advertise:
//          Serial.println(F("In Advertise"));
//          break;
//        default:
//          break;
//      }
//      break;
//    default:
//      break;
//  }
//  
//}