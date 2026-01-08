"""
Audio processing API routes.
"""

import time
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, status
import httpx

from ..config import settings
from ..models.schemas import IntentResponse, ErrorResponse, AudioRecordingInfo, ConfirmIntentRequest, IntentDBStats
from ..services.azure_ml import call_azure_ml, process_ml_response
from ..services.intent_logic import determine_status_and_action, get_ui_options
from ..services.intent_embeddings import add_embedding, get_db_stats, get_available_intents
from ..services.logger import log_request

router = APIRouter(prefix="/api", tags=["Audio"])

# Temporary storage for pending embeddings (for learning loop)
_pending_embeddings: dict[str, list[float]] = {}


@router.post(
    "/audio",
    response_model=IntentResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid audio file"},
        502: {"model": ErrorResponse, "description": "ML endpoint error"},
        503: {"model": ErrorResponse, "description": "ML service unavailable"},
    },
)
async def process_audio(audio: UploadFile = File(...)):
    """
    Process patient audio and return detected intent with UI actions.
    
    ## Audio Recording Flow
    
    1. Patient presses "Speak" button on frontend
    2. Frontend uses Web Audio API / MediaRecorder to record audio
    3. Frontend converts recording to WAV format (16kHz, mono, 16-bit)
    4. Frontend sends WAV file to this endpoint
    5. Backend calls Azure ML for intent detection
    6. Backend returns intent + UI options for patient to confirm
    
    ## Requirements
    
    - **Format**: WAV audio file
    - **Sample Rate**: 16000 Hz (16kHz)
    - **Channels**: Mono (1 channel)
    - **Max Duration**: 3 seconds
    - **Max Size**: 1 MB
    
    ## Response
    
    Returns detected intent, confidence score, status, UI button options,
    and next action for the frontend to take.
    """
    start_time = time.time()
    
    # Step 1: Validate file exists
    if not audio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "invalid_audio", "message": "No audio file provided"},
        )
    
    # Step 2: Validate .wav extension
    filename = audio.filename or ""
    if not filename.lower().endswith(".wav"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "invalid_audio", "message": "Only .wav files are accepted"},
        )
    
    # Step 3: Read file as raw bytes
    try:
        audio_bytes = await audio.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "invalid_audio", "message": f"Failed to read audio file: {str(e)}"},
        )
    
    # Validate file size
    if len(audio_bytes) > settings.MAX_AUDIO_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "invalid_audio", "message": "Audio file exceeds 1MB limit"},
        )
    
    if len(audio_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "invalid_audio", "message": "Audio file is empty"},
        )
    
    # Step 4: Send to Azure ML endpoint
    try:
        ml_response = await call_azure_ml(audio_bytes)
    except httpx.TimeoutException:
        latency_ms = int((time.time() - start_time) * 1000)
        log_request("UNKNOWN", 0.0, "error", latency_ms, "ml_timeout")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "ml_unavailable", "message": "Please try again"},
        )
    except httpx.ConnectError:
        latency_ms = int((time.time() - start_time) * 1000)
        log_request("UNKNOWN", 0.0, "error", latency_ms, "ml_connection_error")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "ml_unavailable", "message": "Cannot connect to ML service"},
        )
    except HTTPException:
        raise
    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        log_request("UNKNOWN", 0.0, "error", latency_ms, str(e))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": "ml_unavailable", "message": str(e)},
        )
    
    # Step 5: Process ML response
    intent, confidence, transcription, alternatives, embedding = process_ml_response(ml_response)
    
    # Store embedding for potential learning (if from HuBERT)
    embedding_id = None
    if embedding:
        embedding_id = str(uuid.uuid4())
        _pending_embeddings[embedding_id] = embedding
        # Keep only last 100 pending embeddings
        if len(_pending_embeddings) > 100:
            oldest = list(_pending_embeddings.keys())[0]
            del _pending_embeddings[oldest]
    
    # Step 6: Apply business logic
    status_result, next_action = determine_status_and_action(intent, confidence)
    ui_options = get_ui_options(intent, status_result)
    
    # Log the request
    latency_ms = int((time.time() - start_time) * 1000)
    log_request(intent, confidence, status_result, latency_ms)
    
    # Step 7: Return structured JSON
    return IntentResponse(
        intent=intent,
        confidence=round(confidence, 2),
        status=status_result,
        ui_options=ui_options,
        next_action=next_action,
        transcription=transcription if transcription else None,
        alternatives=alternatives if alternatives else None,
        embedding_id=embedding_id,
        model_used=ml_response.get("model_used"),
    )


@router.get(
    "/audio/requirements",
    response_model=AudioRecordingInfo,
    tags=["Audio"],
)
async def get_audio_requirements():
    """
    Get audio recording requirements for frontend.
    
    Frontend should use these specifications when recording audio
    from the patient to ensure compatibility with the ML model.
    
    ## Frontend Implementation
    
    ```javascript
    // Example using MediaRecorder API
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
            sampleRate: 16000,
            channelCount: 1,
        }
    });
    
    const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'  // Record as webm
    });
    
    // After recording, convert to WAV before sending
    // Use a library like 'audiobuffer-to-wav' for conversion
    ```
    """
    return AudioRecordingInfo(
        format="wav",
        sample_rate=settings.SAMPLE_RATE,
        max_duration_seconds=settings.MAX_AUDIO_DURATION_SECONDS,
        max_size_bytes=settings.MAX_AUDIO_SIZE_BYTES,
        channels=1,
        bit_depth=16,
    )


@router.post(
    "/audio/confirm",
    tags=["Learning"],
)
async def confirm_intent(embedding_id: str, intent: str):
    """
    Confirm an intent to add the embedding to the learning database.
    
    Called when user confirms intent (blink = YES or caregiver tap).
    This is the learning loop - the system learns from confirmed intents.
    
    Args:
        embedding_id: The embedding_id from the previous /audio response
        intent: The confirmed intent (must be one of the allowed intents)
    """
    # Validate intent
    allowed_intents = get_available_intents()
    if intent not in allowed_intents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "invalid_intent", "message": f"Intent must be one of: {allowed_intents}"},
        )
    
    # Get pending embedding
    if embedding_id not in _pending_embeddings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "embedding_not_found", "message": "Embedding expired or not found"},
        )
    
    embedding = _pending_embeddings.pop(embedding_id)
    
    # Add to database
    success = add_embedding(intent, embedding)
    
    if success:
        return {"status": "ok", "message": f"Learned: {intent}", "db_stats": get_db_stats()}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "learn_failed", "message": "Failed to store embedding"},
        )


@router.get(
    "/audio/intents",
    response_model=IntentDBStats,
    tags=["Learning"],
)
async def get_intents_stats():
    """
    Get available intents and how many samples each has.
    
    Use this to check if the system has enough training data.
    Recommended: 2-3 samples per intent minimum.
    """
    return IntentDBStats(intents=get_db_stats())


@router.get(
    "/audio/intents/list",
    tags=["Learning"],
)
async def list_available_intents():
    """
    Get list of available intents that can be detected.
    """
    return {"intents": get_available_intents()}
