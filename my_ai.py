import speech_recognition as sr
import pyttsx3
import ollama
import os
import ctypes
import threading
import datetime
import psutil
import pyautogui
import cv2
import re
import webbrowser
import time
import winsound  # টাইমারের বিপের জন্য (উইন্ডোজ)

# ===============================
# Configuration
# ===============================
engine = pyttsx3.init()
engine.setProperty("rate", 170)

WAKE_WORD = "hey jarvis"
USE_FACE_DETECTION = True

# ===============================
# Core Functions
# ===============================
def speak(text):
    print("Jarvis:", text)
    engine.say(text)
    engine.runAndWait()

def listen(timeout=None):
    r = sr.Recognizer()
    with sr.Microphone() as source:
        r.adjust_for_ambient_noise(source, duration=0.7)
        print("Listening...")
        try:
            audio = r.listen(source, timeout=timeout)
            command = r.recognize_google(audio).lower()
            print("You:", command)
            return command
        except:
            return ""

def ask_llm(prompt):
    try:
        response = ollama.chat(
            model="llama3",
            messages=[{"role": "user", "content": prompt}]
        )
        return response["message"]["content"]
    except Exception as e:
        return "My local brain is not responding."

def start_timer(seconds):
    time.sleep(seconds)
    speak("Your timer is finished.")
    try:
        winsound.Beep(1000, 1500)
    except:
        pass  # লিনাক্স/ম্যাক হলে সাউন্ড হবে না

def open_website(command):
    patterns = [
        r"(go to|open)\s+([a-zA-Z0-9\-\.]+(?:\.[a-zA-Z]{2,})?)",
        r"(open|go to)\s+([a-zA-Z\s]+)"
    ]
    for pattern in patterns:
        match = re.search(pattern, command)
        if match:
            site = match.group(2).strip().lower()
            if not site.startswith("http"):
                if "." not in site:
                    site = site + ".com"
                site = "https://" + site
            speak(f"Opening {site}")
            webbrowser.open(site)
            return True
    return False

def get_prayer_times():
    try:
        import requests
        url = "http://api.aladhan.com/v1/timingsByCity?city=Chattogram&country=Bangladesh&method=4"
        response = requests.get(url)
        data = response.json()
        if data["code"] == 200:
            t = data["data"]["timings"]
            text = (f"Today's prayer times in Chattogram: "
                    f"Fajr {t['Fajr']}, "
                    f"Zuhr {t['Dhuhr']}, "
                    f"Asr {t['Asr']}, "
                    f"Maghrib {t['Maghrib']}, "
                    f"Isha {t['Isha']}.")
            speak(text)
        else:
            speak("Couldn't fetch prayer times. Opening website.")
            webbrowser.open("https://timesprayer.com/en/prayer-times-in-chittagong.html")
    except:
        speak("Need internet or 'requests' library. Opening website instead.")
        webbrowser.open("https://timesprayer.com/en/prayer-times-in-chittagong.html")

def process_command(command):
    if "exit" in command or "stop" in command or "goodbye" in command:
        speak("Goodbye Master.")
        return "exit"

    if open_website(command):
        return "handled"

    if any(k in command for k in ["prayer time", "namaz", "salah", "azan", "prayer"]):
        threading.Thread(target=get_prayer_times).start()
        return "handled"

    if "bluetooth" in command:
        speak("Opening Bluetooth settings.")
        os.system("start ms-settings:bluetooth")
        return "handled"

    if "wifi" in command:
        speak("Opening WiFi settings.")
        os.system("start ms-settings:network-wifi")
        return "handled"

    if "lock computer" in command or "lock pc" in command:
        speak("Locking your computer.")
        ctypes.windll.user32.LockWorkStation()
        return "handled"

    if "shutdown" in command:
        speak("Shutting down your system.")
        os.system("shutdown /s /t 5")
        return "handled"

    if "restart" in command:
        speak("Restarting your system.")
        os.system("shutdown /r /t 5")
        return "handled"

    if "screenshot" in command:
        filename = f"screenshot_{int(time.time())}.png"
        pyautogui.screenshot(filename)
        speak("Screenshot saved.")
        return "handled"

    if "battery" in command:
        battery = psutil.sensors_battery()
        if battery:
            speak(f"Battery is at {battery.percent} percent.")
        else:
            speak("Couldn't read battery info.")
        return "handled"

    if "time" in command:
        now = datetime.datetime.now().strftime("%I:%M %p")
        speak(f"The current time is {now}")
        return "handled"

    if "timer" in command:
        speak("How many seconds?")
        sec_input = listen(timeout=10)
        try:
            seconds = int(''.join(filter(str.isdigit, sec_input)))
            speak(f"Timer set for {seconds} seconds.")
            threading.Thread(target=start_timer, args=(seconds,)).start()
        except:
            speak("I couldn't understand the time.")
        return "handled"

    # Default: Local LLM
    reply = ask_llm(command)
    speak(reply)
    return "handled"

# ===============================
# Face Detection Setup
# ===============================
if USE_FACE_DETECTION:
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    cap = cv2.VideoCapture(0)

# ===============================
# Startup
# ===============================
speak("Jarvis Ultimate Assistant is online. Say 'Hey Jarvis' to wake me.")

# ===============================
# Main Loop
# ===============================
is_active = False

while True:
    face_detected = True  # ডিফল্ট ট্রু, ফেস ডিটেকশন অফ থাকলে সবসময় শুনবে

    if USE_FACE_DETECTION:
        ret, frame = cap.read()
        if not ret:
            break
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)
        face_detected = len(faces) > 0

    if face_detected:
        if not is_active:
            command = listen(timeout=3)
            if WAKE_WORD in command:
                speak("I am listening, Master.")
                is_active = True

        while is_active:
            command = listen(timeout=10)
            if command:
                result = process_command(command)
                if result == "exit":
                    is_active = False
                    break
            # টাইমআউট হলে চুপচাপ অপেক্ষা করবে

    else:
        is_active = False
        time.sleep(0.5)  # CPU বাঁচানোর জন্য

    if USE_FACE_DETECTION and cv2.waitKey(1) & 0xFF == ord('q'):
        break

if USE_FACE_DETECTION:
    cap.release()
    cv2.destroyAllWindows()