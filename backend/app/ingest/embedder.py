import os
from sentence_transformers import SentenceTransformer
from app.config import EMBEDDING_MODEL

_model = None

# ✅ Explicit, writable cache directory
MODEL_CACHE_DIR = os.path.join(os.getcwd(), "model_cache")

def get_embedding_model():
    global _model
    if _model is None:
        os.makedirs(MODEL_CACHE_DIR, exist_ok=True)
        _model = SentenceTransformer(   
            EMBEDDING_MODEL,
            cache_folder=MODEL_CACHE_DIR
        )
    return _model

def embed_texts(texts):
    model = get_embedding_model()
    return model.encode(texts, convert_to_numpy=True).tolist()
