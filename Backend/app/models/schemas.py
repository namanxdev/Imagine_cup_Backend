"""
Pydantic schemas for API request/response models.
"""

from typing import Optional
from pydantic import BaseModel


class TopPrediction(BaseModel):
    """A single prediction with intent and confidence."""
    intent: str
    confidence: float


class IntentResponse(BaseModel):
    """Response model for audio processing endpoint."""
    intent: str
    confidence: float
    status: str
    ui_options: list[str]
    next_action: str
    transcription: Optional[str] = None  # For Wav2Vec
    alternatives: Optional[list[str]] = None  # For low confidence
    embedding_id: Optional[str] = None  # To reference for learning
    model_used: Optional[str] = None  # Which model was used
    top_predictions: Optional[list[TopPrediction]] = None  # Top 3 predictions


class ConfirmIntentRequest(BaseModel):
    """Request to confirm an intent (learning loop)."""
    intent: str
    embedding: list[float]  # 768-d embedding to store


class IntentDBStats(BaseModel):
    """Stats about the intent embedding database."""
    intents: dict[str, int]  # intent -> count of samples


class HealthResponse(BaseModel):
    """Response model for health check endpoint."""
    status: str
    ml_endpoints: dict  # Status for each model (hubert, wave2vec)


class ErrorResponse(BaseModel):
    """Response model for error responses."""
    error: str
    message: Optional[str] = None


class AudioRecordingInfo(BaseModel):
    """Information about audio recording requirements for frontend."""
    format: str = "wav"
    sample_rate: int = 16000
    max_duration_seconds: int = 3
    max_size_bytes: int = 1048576  # 1 MB
    channels: int = 1  # Mono
    bit_depth: int = 16
