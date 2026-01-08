import requests
import json
import os
import base64
import glob
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get configuration for both models
models = {
    'HuBERT': {
        'url': os.getenv('REST_END_POINT__HUBERT'),
        'api_key': os.getenv('PRIMARY_KEY__HUBERT')
    },
    'Wav2Vec': {
        'url': os.getenv('REST_END_POINT__WAVE2VEC'),
        'api_key': os.getenv('PRIMARY_KEY__WAVE2VEC')
    }
}

# Validate both endpoints
for model_name, config in models.items():
    if not config['api_key']:
        raise Exception(f"API key for {model_name} not found. Check your .env file.")
    if not config['url']:
        raise Exception(f"Endpoint URL for {model_name} not found. Check your .env file.")

# Get all audio files from Audio_files folder
audio_folder = os.path.join(os.path.dirname(__file__), 'Audio_files')
audio_files = sorted(glob.glob(os.path.join(audio_folder, '*.wav')))

print("=" * 70)
print("Testing Azure ML Endpoints - HuBERT & Wav2Vec")
print("=" * 70)
print(f"HuBERT Endpoint: {models['HuBERT']['url']}")
print(f"Wav2Vec Endpoint: {models['Wav2Vec']['url']}")
print(f"Audio folder: {audio_folder}")
print(f"Found {len(audio_files)} audio file(s)")
print("=" * 70)

results = {'HuBERT': [], 'Wav2Vec': []}

for i, audio_file_path in enumerate(audio_files, 1):
    filename = os.path.basename(audio_file_path)
    print(f"\n[{i}/{len(audio_files)}] Processing: {filename}")
    
    # Read and encode the audio file as base64
    with open(audio_file_path, 'rb') as audio_file:
        audio_bytes = audio_file.read()
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
    
    print(f"  Size: {len(audio_bytes)} bytes")
    
    # Prepare request data
    data = {
        "audio": audio_base64,
        "sample_rate": 16000
    }
    
    # Test both models
    for model_name, config in models.items():
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Bearer {config["api_key"]}'
        }
        
        try:
            response = requests.post(
                config['url'],
                json=data,
                headers=headers,
                timeout=120
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Debug: Show full response for HuBERT to diagnose issue
                if model_name == 'HuBERT':
                    print(f"  🔍 [{model_name}] Full response: {result}")
                
                transcription = result.get('transcription', 'N/A')
                print(f"  ✅ [{model_name}] Transcription: {transcription}")
                results[model_name].append({
                    'file': filename,
                    'status': 'success',
                    'transcription': transcription,
                    'full_response': result
                })
            else:
                print(f"  ❌ [{model_name}] Failed (Status {response.status_code}): {response.text[:100]}")
                results[model_name].append({
                    'file': filename,
                    'status': 'error',
                    'error': response.text[:100]
                })
                
        except requests.exceptions.Timeout:
            print(f"  ❌ [{model_name}] Timeout")
            results[model_name].append({'file': filename, 'status': 'timeout'})
        except requests.exceptions.ConnectionError as e:
            print(f"  ❌ [{model_name}] Connection error: {e}")
            results[model_name].append({'file': filename, 'status': 'connection_error'})
        except Exception as e:
            print(f"  ❌ [{model_name}] Error: {e}")
            results[model_name].append({'file': filename, 'status': 'error', 'error': str(e)})

# Summary
print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)

for model_name in ['HuBERT', 'Wav2Vec']:
    model_results = results[model_name]
    success_count = sum(1 for r in model_results if r['status'] == 'success')
    print(f"\n{model_name}: Total: {len(model_results)} | Success: {success_count} | Failed: {len(model_results) - success_count}")
    print(f"  Transcriptions:")
    for r in model_results:
        if r['status'] == 'success':
            print(f"    {r['file']}: {r['transcription']}")
        else:
            print(f"    {r['file']}: [ERROR - {r['status']}]")

# Comparison
print("\n" + "=" * 70)
print("COMPARISON (Side by Side)")
print("=" * 70)
print(f"{'File':<30} {'HuBERT':<20} {'Wav2Vec':<20}")
print("-" * 70)
for i, filename in enumerate([os.path.basename(f) for f in audio_files]):
    hubert_result = results['HuBERT'][i] if i < len(results['HuBERT']) else {'status': 'N/A'}
    wav2vec_result = results['Wav2Vec'][i] if i < len(results['Wav2Vec']) else {'status': 'N/A'}
    
    hubert_text = hubert_result.get('transcription', f"[{hubert_result['status']}]")[:18]
    wav2vec_text = wav2vec_result.get('transcription', f"[{wav2vec_result['status']}]")[:18]
    
    print(f"{filename:<30} {hubert_text:<20} {wav2vec_text:<20}")