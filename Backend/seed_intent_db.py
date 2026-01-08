"""
Seed the intent database with audio samples for APHASIA/STROKE patients.
Uses Text-to-Speech to generate synthetic audio for each intent,
then sends through the API to build the embedding database.

Designed for patients with:
- Slurred speech
- Difficulty pronouncing certain sounds  
- Slower/fragmented speech
- Limited vocabulary
- Short utterances

Target: 100+ samples across intents
"""

import os
import requests
import time
from pathlib import Path

# Try different TTS libraries
TTS_ENGINE = None

try:
    import pyttsx3
    TTS_ENGINE = "pyttsx3"
except ImportError:
    pass

if not TTS_ENGINE:
    try:
        from gtts import gTTS
        TTS_ENGINE = "gtts"
    except ImportError:
        pass

BASE_URL = "http://127.0.0.1:8000"
AUDIO_DIR = Path("Audio_files/Synthetic")

# =============================================================================
# INTENT PHRASES FOR APHASIA/STROKE PATIENTS
# =============================================================================
# Short, simple words that are easier to produce with speech impairments
# Includes common approximations and phonetic variations
# Multiple ways to express same intent for robust recognition

INTENT_PHRASES = {
    # -------------------------------------------------------------------------
    # HELP - Calling for assistance (20 samples)
    # -------------------------------------------------------------------------
    "HELP": [
        # Clear attempts
        "help",
        "help me",
        "help please",
        "need help",
        "want help",
        # Simplified/slurred approximations
        "hep",
        "hep me",
        "elp",
        "elp me",
        "he-elp",
        # Alternative expressions
        "assist",
        "assist me",
        "come here",
        "come",
        "here",
        # Desperate/urgent variations
        "please help",
        "please",
        "someone",
        "anyone",
        "call someone",
    ],
    
    # -------------------------------------------------------------------------
    # WATER - Thirst/hydration needs (20 samples)
    # -------------------------------------------------------------------------
    "WATER": [
        # Clear attempts
        "water",
        "water please",
        "want water",
        "need water",
        "some water",
        # Simplified/slurred approximations
        "wa-wa",
        "wawa",
        "wah-ter",
        "wa-er",
        "wotter",
        # Alternative expressions for thirst
        "thirsty",
        "thirst",
        "drink",
        "drink please",
        "want drink",
        # Related needs
        "juice",
        "cup",
        "sip",
        "wet",
        "dry mouth",
    ],
    
    # -------------------------------------------------------------------------
    # YES - Affirmative responses (20 samples)
    # -------------------------------------------------------------------------
    "YES": [
        # Clear attempts
        "yes",
        "yes please",
        "yeah",
        "yep",
        "yup",
        # Simplified/slurred approximations
        "ya",
        "ye",
        "uh huh",
        "mm hmm",
        "hmm",
        # Alternative affirmatives
        "okay",
        "ok",
        "alright",
        "sure",
        "right",
        # Emphatic
        "yes yes",
        "good",
        "fine",
        "want",
        "please",
    ],
    
    # -------------------------------------------------------------------------
    # NO - Negative responses (20 samples)
    # -------------------------------------------------------------------------
    "NO": [
        # Clear attempts
        "no",
        "no thanks",
        "no please",
        "not now",
        "don't want",
        # Simplified/slurred approximations
        "nah",
        "nope",
        "na",
        "uh uh",
        "mm mm",
        # Alternative negatives
        "stop",
        "don't",
        "wait",
        "later",
        "not yet",
        # Refusal expressions
        "enough",
        "done",
        "away",
        "leave",
        "none",
    ],
    
    # -------------------------------------------------------------------------
    # PAIN - Discomfort/pain communication (25 samples)
    # -------------------------------------------------------------------------
    "PAIN": [
        # Clear attempts
        "pain",
        "it hurts",
        "hurts",
        "hurt",
        "hurting",
        # Simplified/slurred approximations
        "ow",
        "oww",
        "ouch",
        "ah",
        "aah",
        # Body-specific (common stroke patient needs)
        "head hurts",
        "head",
        "arm",
        "leg",
        "chest",
        # Descriptive
        "sore",
        "ache",
        "bad",
        "sharp",
        "burning",
        # Intensity
        "pain bad",
        "very pain",
        "more pain",
        "less pain",
        "pain gone",
    ],
    
    # -------------------------------------------------------------------------
    # EMERGENCY - Urgent medical attention (20 samples)
    # -------------------------------------------------------------------------
    "EMERGENCY": [
        # Clear attempts
        "emergency",
        "urgent",
        "help now",
        "need doctor",
        "call doctor",
        # Simplified/urgent calls
        "doctor",
        "nurse",
        "nine one one",
        "call",
        "quick",
        # Symptom alerts
        "can't breathe",
        "can't move",
        "dizzy",
        "falling",
        "sick",
        # Panic expressions
        "something wrong",
        "not right",
        "bad",
        "very bad",
        "scared",
    ],
    
    # -------------------------------------------------------------------------
    # BATHROOM - Toileting needs (15 samples)
    # -------------------------------------------------------------------------
    "BATHROOM": [
        # Clear attempts
        "bathroom",
        "toilet",
        "need bathroom",
        "want bathroom",
        "go bathroom",
        # Simplified expressions
        "potty",
        "pee",
        "wee",
        "number one",
        "number two",
        # Urgent
        "bathroom now",
        "toilet please",
        "have to go",
        "can't hold",
        "accident",
    ],
    
    # -------------------------------------------------------------------------
    # TIRED - Rest/sleep needs (10 samples)
    # -------------------------------------------------------------------------
    "TIRED": [
        # Clear attempts
        "tired",
        "sleepy",
        "want sleep",
        "need rest",
        "exhausted",
        # Simplified
        "sleep",
        "rest",
        "lay down",
        "bed",
        "nap",
    ],
    
    # -------------------------------------------------------------------------
    # COLD/HOT - Temperature comfort (10 samples)
    # -------------------------------------------------------------------------
    "COLD": [
        "cold",
        "freezing",
        "chilly",
        "blanket",
        "warm me",
    ],
    
    "HOT": [
        "hot",
        "warm",
        "sweating",
        "fan",
        "too hot",
    ],
}


def generate_audio_pyttsx3(text: str, output_path: str):
    """Generate audio using pyttsx3 (offline)."""
    engine = pyttsx3.init()
    engine.setProperty('rate', 150)  # Slower speech
    engine.save_to_file(text, output_path)
    engine.runAndWait()
    return os.path.exists(output_path)


def generate_audio_gtts(text: str, output_path: str):
    """Generate audio using Google TTS (needs internet)."""
    tts = gTTS(text=text, lang='en', slow=True)
    tts.save(output_path)
    return os.path.exists(output_path)


def generate_audio(text: str, output_path: str) -> bool:
    """Generate audio file from text."""
    if TTS_ENGINE == "pyttsx3":
        return generate_audio_pyttsx3(text, output_path)
    elif TTS_ENGINE == "gtts":
        return generate_audio_gtts(text, output_path)
    else:
        print("ERROR: No TTS engine available!")
        print("Install one of: pip install pyttsx3  OR  pip install gtts")
        return False


def send_audio_and_confirm(audio_path: str, intent: str) -> bool:
    """Send audio to API and confirm the intent."""
    # Step 1: Send audio
    with open(audio_path, 'rb') as f:
        files = {'audio': (audio_path, f, 'audio/wav')}
        response = requests.post(f"{BASE_URL}/api/audio", files=files)
    
    if response.status_code != 200:
        print(f"  ERROR sending audio: {response.status_code}")
        return False
    
    result = response.json()
    embedding_id = result.get("embedding_id")
    
    if not embedding_id:
        print(f"  No embedding_id returned (model might be Wav2Vec)")
        return False
    
    # Step 2: Confirm intent
    params = {"embedding_id": embedding_id, "intent": intent}
    response = requests.post(f"{BASE_URL}/api/audio/confirm", params=params)
    
    if response.status_code != 200:
        print(f"  ERROR confirming: {response.status_code}")
        return False
    
    return True


def main():
    print(f"TTS Engine: {TTS_ENGINE or 'NONE'}")
    
    if not TTS_ENGINE:
        print("\n❌ No TTS engine found!")
        print("Install one of these:")
        print("  pip install pyttsx3   (offline, works on Windows)")
        print("  pip install gtts      (needs internet)")
        return
    
    # Create output directory
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    
    print("\n=== STEP 1: Generate Audio Files ===")
    generated_files = {}
    
    for intent, phrases in INTENT_PHRASES.items():
        generated_files[intent] = []
        print(f"\n[{intent}]")
        
        for i, phrase in enumerate(phrases):
            filename = f"{intent.lower()}_{i+1}.wav"
            filepath = AUDIO_DIR / filename
            
            print(f"  Generating: {phrase} -> {filename}...", end=" ")
            
            if generate_audio(phrase, str(filepath)):
                generated_files[intent].append(str(filepath))
                print("✓")
            else:
                print("✗")
            
            time.sleep(0.5)  # Small delay for TTS engine
    
    print("\n=== STEP 2: Seed Database ===")
    print("Make sure the server is running: python main.py")
    input("Press Enter to continue...")
    
    success_count = 0
    total_count = 0
    
    for intent, files in generated_files.items():
        print(f"\n[{intent}]")
        
        for filepath in files:
            total_count += 1
            print(f"  Processing: {Path(filepath).name}...", end=" ")
            
            if send_audio_and_confirm(filepath, intent):
                success_count += 1
                print("✓ Learned!")
            else:
                print("✗ Failed")
            
            time.sleep(1)  # Rate limiting
    
    print(f"\n=== DONE ===")
    print(f"Successfully seeded: {success_count}/{total_count} samples")
    
    # Show DB stats
    try:
        response = requests.get(f"{BASE_URL}/api/audio/intents")
        if response.status_code == 200:
            print(f"\nDatabase stats: {response.json()}")
    except:
        pass


if __name__ == "__main__":
    main()
