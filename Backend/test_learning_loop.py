import requests
import json
import time
import os

BASE_URL = "http://127.0.0.1:8000"
AUDIO_FILE = "Audio_files/help_help_me_please.wav"

def get_audio_intent():
    print(f"Sending {AUDIO_FILE}...")
    with open(AUDIO_FILE, 'rb') as f:
        files = {'audio': (AUDIO_FILE, f, 'audio/wav')}
        response = requests.post(f"{BASE_URL}/api/audio", files=files)
    
    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None
    
    return response.json()

def confirm_intent(embedding_id, intent_label):
    print(f"Confirming embedding {embedding_id} as '{intent_label}'...")
    # API expects query parameters, not JSON body
    params = {
        "embedding_id": embedding_id,
        "intent": intent_label
    }
    response = requests.post(f"{BASE_URL}/api/audio/confirm", params=params)
    
    if response.status_code != 200:
        print(f"Error confirming: {response.status_code}")
        print(response.text)
        return False
    
    print("Confirmation successful!")
    return True

def main():
    # Wait for server to start if run immediately
    time.sleep(5)
    
    # 1. First Request - Expect UNKNOWN or initial inference
    print("\n--- STEP 1: Initial Request ---")
    result1 = get_audio_intent()
    if not result1: return

    print("Result 1:", json.dumps(result1, indent=2))
    
    embedding_id = result1.get("embedding_id")
    current_intent = result1.get("intent")

    if not embedding_id:
        print("No embedding_id found. Is the HuBERT model being used?")
        return

    # 2. Emulate User Correction/Confirmation
    target_intent = "HELP"
    if current_intent == target_intent:
        print(f"Model already predicted {target_intent}. Test irrelevant unless we force a new one.")
        # But maybe we want to reinforce it?
    
    print(f"\n--- STEP 2: Teaching 'embedding' -> {target_intent} ---")
    if confirm_intent(embedding_id, target_intent):
        
        # 3. Verify Learning
        print("\n--- STEP 3: Verification Request ---")
        result2 = get_audio_intent()
        if not result2: return
        
        print("Result 2:", json.dumps(result2, indent=2))
        
        if result2.get("intent") == target_intent:
            print(f"\nSUCCESS: System learned to associate audio with {target_intent}!")
        else:
            print(f"\nFAILURE: Expected {target_intent}, got {result2.get('intent')}")

if __name__ == "__main__":
    main()
