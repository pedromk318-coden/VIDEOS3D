#!/usr/bin/env python3
"""Generate narration with ElevenLabs and word-level timing for the existing audio mixer."""
import base64
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOICE_DIR = ROOT / "voice"
TEXT_PATH = VOICE_DIR / "narration.txt"
VOICE_PATH = VOICE_DIR / "voice.wav"
WORDS_PATH = VOICE_DIR / "words.json"
TMP_MP3 = VOICE_DIR / "voice-elevenlabs.mp3"


def fail(message):
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def main():
    api_key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "").strip()
    if not api_key:
        fail("Missing GitHub Actions secret ELEVENLABS_API_KEY.")
    if not voice_id:
        fail("Missing GitHub Actions secret ELEVENLABS_VOICE_ID.")
    if not TEXT_PATH.is_file():
        fail(f"Narration text not found: {TEXT_PATH}")

    text = TEXT_PATH.read_text(encoding="utf-8").strip()
    if not text:
        fail("templates/voice/narration.txt is empty.")

    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    query = urllib.parse.urlencode({"output_format": "mp3_44100_128"})
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps?{query}"
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.42,
            "similarity_boost": 0.78,
            "style": 0.28,
            "use_speaker_boost": True
        }
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"xi-api-key": api_key, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:1200]
        fail(f"ElevenLabs returned HTTP {exc.code}: {detail}")
    except Exception as exc:
        fail(f"ElevenLabs request failed: {exc}")

    audio_b64 = result.get("audio_base64")
    alignment = result.get("alignment") or result.get("normalized_alignment")
    if not audio_b64 or not alignment:
        fail("ElevenLabs response did not include audio_base64 and character timestamps.")

    TMP_MP3.write_bytes(base64.b64decode(audio_b64))
    subprocess.run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(TMP_MP3), "-ar", "48000", "-ac", "2",
        "-c:a", "pcm_s24le", str(VOICE_PATH)
    ], check=True)

    chars = alignment.get("characters", [])
    starts = alignment.get("character_start_times_seconds", [])
    ends = alignment.get("character_end_times_seconds", [])
    if not chars or len(chars) != len(starts) or len(chars) != len(ends):
        fail("ElevenLabs character alignment arrays have inconsistent lengths.")

    spoken = "".join(chars)
    words = []
    for match in re.finditer(r"\S+", spoken, flags=re.UNICODE):
        indexes = range(match.start(), match.end())
        valid = [i for i in indexes if i < len(starts) and i < len(ends)]
        if not valid:
            continue
        words.append({
            "w": match.group(0),
            "s": round(min(float(starts[i]) for i in valid), 4),
            "e": round(max(float(ends[i]) for i in valid), 4),
        })
    if not words:
        fail("Could not build word timings from ElevenLabs alignment.")

    WORDS_PATH.write_text(json.dumps(words, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"ElevenLabs voice generated: {VOICE_PATH}")
    print(f"Word timing entries: {len(words)}")
    print(f"Speech duration: {max(w['e'] for w in words):.2f} seconds")


if __name__ == "__main__":
    main()
