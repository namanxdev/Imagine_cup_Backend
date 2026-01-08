"""
Embedding-based intent classification using cosine similarity.
No text conversion needed - works directly with HuBERT embeddings.
"""

import json
import os
import numpy as np
from pathlib import Path

# Fixed intent set for stroke/aphasia patients
INTENTS = [
    "HELP",       # General assistance
    "WATER",      # Thirst/hydration
    "YES",        # Affirmative
    "NO",         # Negative
    "PAIN",       # Discomfort
    "EMERGENCY",  # Urgent medical
    "BATHROOM",   # Toileting
    "TIRED",      # Rest/sleep
    "COLD",       # Temperature - cold
    "HOT",        # Temperature - hot
]

# In-memory intent database (embeddings per intent)
_intent_db: dict[str, list[list[float]]] = {intent: [] for intent in INTENTS}

# File path for persistence
DB_FILE = Path(__file__).parent.parent.parent / "intent_embeddings.json"


def _load_db():
    """Load intent database from file."""
    global _intent_db
    if DB_FILE.exists():
        try:
            with open(DB_FILE, "r") as f:
                loaded = json.load(f)
                # Merge with INTENTS (in case new intents added)
                for intent in INTENTS:
                    _intent_db[intent] = loaded.get(intent, [])
            print(f"[INFO] Loaded intent DB with {sum(len(v) for v in _intent_db.values())} embeddings")
        except Exception as e:
            print(f"[WARNING] Could not load intent DB: {e}")


def _save_db():
    """Save intent database to file."""
    try:
        with open(DB_FILE, "w") as f:
            json.dump(_intent_db, f)
        print(f"[INFO] Saved intent DB")
    except Exception as e:
        print(f"[ERROR] Could not save intent DB: {e}")


# Load on import
_load_db()


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Calculate cosine similarity between two vectors."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def predict_intent(embedding: list[float]) -> tuple[str, float, list[str]]:
    """
    Predict intent using cosine similarity to stored examples.
    
    Args:
        embedding: 768-dimensional HuBERT embedding
        
    Returns:
        tuple: (best_intent, confidence, alternatives)
    """
    embedding_arr = np.array(embedding)
    
    scores = {}
    
    for intent, samples in _intent_db.items():
        if not samples:
            continue
        
        # Calculate similarity to all samples for this intent
        similarities = [
            cosine_similarity(embedding_arr, np.array(sample))
            for sample in samples
        ]
        scores[intent] = np.mean(similarities)
    
    if not scores:
        # No samples stored yet - return unknown
        return "UNKNOWN", 0.0, INTENTS[:3]
    
    # Sort by score
    sorted_intents = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    
    best_intent, best_score = sorted_intents[0]
    
    # Get alternatives (next 2 best)
    alternatives = [intent for intent, _ in sorted_intents[1:3]]
    
    return best_intent, best_score, alternatives


def add_embedding(intent: str, embedding: list[float]) -> bool:
    """
    Add a confirmed embedding to the intent database.
    Called when user confirms intent (learning loop).
    
    Args:
        intent: The confirmed intent
        embedding: The 768-d embedding to store
        
    Returns:
        bool: Success
    """
    if intent not in INTENTS:
        print(f"[ERROR] Unknown intent: {intent}")
        return False
    
    _intent_db[intent].append(embedding)
    _save_db()
    
    print(f"[INFO] Added embedding to {intent}, now has {len(_intent_db[intent])} samples")
    return True


def get_db_stats() -> dict:
    """Get statistics about the intent database."""
    return {
        intent: len(samples) 
        for intent, samples in _intent_db.items()
    }


def get_available_intents() -> list[str]:
    """Get list of available intents."""
    return INTENTS.copy()


def clear_intent(intent: str) -> bool:
    """Clear all embeddings for an intent."""
    if intent in _intent_db:
        _intent_db[intent] = []
        _save_db()
        return True
    return False
