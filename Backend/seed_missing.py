"""
Quick script to seed just the missing TIRED, COLD, HOT intents.
Run after restarting the server.
"""
import requests
import time
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"
AUDIO_DIR = Path("Audio_files/Synthetic")

# Only the failed intents
MISSING_INTENTS = {
    "TIRED": [f"tired_{i}.wav" for i in range(1, 11)],
    "COLD": [f"cold_{i}.wav" for i in range(1, 6)],
    "HOT": [f"hot_{i}.wav" for i in range(1, 6)],
}

def send_and_confirm(filepath: Path, intent: str) -> bool:
    with open(filepath, 'rb') as f:
        files = {'audio': (filepath.name, f, 'audio/wav')}
        resp = requests.post(f"{BASE_URL}/api/audio", files=files)
    
    if resp.status_code != 200:
        print(f"  Audio upload failed: {resp.status_code}")
        return False
    
    embedding_id = resp.json().get("embedding_id")
    if not embedding_id:
        print(f"  No embedding_id")
        return False
    
    resp = requests.post(f"{BASE_URL}/api/audio/confirm", 
                         params={"embedding_id": embedding_id, "intent": intent})
    
    if resp.status_code != 200:
        print(f"  Confirm failed: {resp.status_code} - {resp.text}")
        return False
    
    return True

def main():
    print("Seeding TIRED, COLD, HOT intents...")
    print("Make sure server is RESTARTED with new code!\n")
    
    success = 0
    total = 0
    
    for intent, files in MISSING_INTENTS.items():
        print(f"\n[{intent}]")
        for filename in files:
            filepath = AUDIO_DIR / filename
            total += 1
            print(f"  {filename}...", end=" ")
            
            if send_and_confirm(filepath, intent):
                success += 1
                print("✓")
            else:
                print("✗")
            
            time.sleep(1)
    
    print(f"\n=== Done: {success}/{total} ===")
    
    # Show stats
    try:
        resp = requests.get(f"{BASE_URL}/api/audio/intents")
        print(f"\nDatabase: {resp.json()}")
    except:
        pass

if __name__ == "__main__":
    main()
