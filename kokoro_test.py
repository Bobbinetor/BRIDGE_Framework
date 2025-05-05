import requests
import os
import io
import base64
import json

# --- Configuration ---
# Kokoro API configuration
KOKORO_BASE_URL = os.getenv("KOKORO_API_URL", "http://localhost:8880")
KOKORO_TTS_URL = f"{KOKORO_BASE_URL}/v1/audio/speech"

# Since we don't have a direct Kokoro STT endpoint, we'll use a dummy implementation
# that returns a hardcoded text (in a real scenario, you would integrate with a proper STT service)
# KOKORO_STT_URL = f"{KOKORO_BASE_URL}/v1/audio/transcriptions"  # This doesn't exist

# Default voice and format for TTS
DEFAULT_TTS_VOICE = "af_bella"
DEFAULT_TTS_FORMAT = "mp3"

# --- Mock STT Function since Kokoro doesn't have an STT endpoint ---
def process_audio(audio_file_storage):
    """
    Simulates STT functionality since Kokoro doesn't have a /v1/audio/transcriptions endpoint.
    In a production environment, you would replace this with a real STT service call.
    
    Args:
        audio_file_storage: The FileStorage object from Flask request.files.
        
    Returns:
        A hardcoded transcript for testing purposes.
    """
    print("Processing audio file... (Mock implementation)")
    
    # In a real implementation, you would send this file to a proper STT service
    # For now, we'll return a fixed message for testing
    
    # Read some information about the file to show in logs
    audio_file_storage.seek(0)
    file_size = len(audio_file_storage.read())
    audio_file_storage.seek(0)  # Reset file pointer
    
    print(f"Received audio file: {audio_file_storage.filename}, size: {file_size} bytes, type: {audio_file_storage.mimetype}")
    print("Note: Using mock STT implementation - Kokoro doesn't provide an STT endpoint.")
    
    # Return a fixed message for testing - in production, replace with actual STT service
    return "Questo è un messaggio di test generato automaticamente. La trascrizione vocale non è disponibile con l'API Kokoro attuale."

# --- TTS Function - No Changes Needed ---
def kokoro_tts(text_to_speak):
    """Sends text to Kokoro TTS API and returns audio data and mime type.

    Args:
        text_to_speak: The string of text to convert to speech.

    Returns:
        A tuple (audio_data_bytes, mime_type_string), or raises an exception on error.
    """
    print(f"Sending text to Kokoro TTS: '{text_to_speak[:50]}...'")
    kokoro_headers = {
        "Content-Type": "application/json",
        "Accept": f"audio/{DEFAULT_TTS_FORMAT}"
    }
    kokoro_payload = {
        "model": "kokoro",  # Cambiato da "kokoro-tts" a "kokoro" come indicato nella documentazione
        "input": text_to_speak,
        "voice": DEFAULT_TTS_VOICE,
        "response_format": DEFAULT_TTS_FORMAT,
        "speed": 1,  # Aggiunto parametro speed
        "stream": False,  # Non vogliamo lo streaming per questa implementazione
        "return_download_link": False  # Non abbiamo bisogno del link di download
    }

    try:
        response = requests.post(KOKORO_TTS_URL, headers=kokoro_headers, json=kokoro_payload)
        response.raise_for_status()

        content_type = response.headers.get('Content-Type')
        # Adattato per riconoscere sia audio/mp3 che audio/mpeg
        expected_mime_types = [f"audio/{DEFAULT_TTS_FORMAT}", "audio/mpeg"]
        
        # Verifica se il content_type corrisponde a uno dei formati accettati
        if content_type and any(content_type.startswith(mime) for mime in expected_mime_types):
            audio_data = response.content
            print(f"Received {len(audio_data)} bytes of audio data ({content_type}).")
            # Ritorna sempre il content type ricevuto dal server, non quello che ci aspettavamo
            return audio_data, content_type
        else:
            print(f"Error: Kokoro TTS returned unexpected content type: {content_type}")
            print("Response content:", response.text)
            raise RuntimeError(f"Kokoro TTS failed. Unexpected response type: {content_type}")

    except requests.exceptions.RequestException as e:
        print(f"Error interacting with Kokoro TTS API: {e}")
        print("Response content:", response.text if 'response' in locals() else 'No response object')
        raise RuntimeError(f"Kokoro TTS API request failed: {e}") from e
    except Exception as e:
        print(f"An unexpected error occurred during TTS processing: {e}")
        raise RuntimeError(f"Unexpected TTS error: {e}") from e