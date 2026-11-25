#!/usr/bin/env python3
"""Prepare the user's uploaded narration MP3 for the existing audio mixer.

The mixer needs a 48 kHz stereo WAV and word timing spans. Since this is a
pre-recorded MP3 (not an ElevenLabs API response), word spans are estimated
from the narration text and the measured audio duration. Music and SFX remain
on the original authored timeline.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOICE_DIR = ROOT / "voice"
TEXT_PATH = VOICE_DIR / "narration.txt"
SOURCE_MP3 = ROOT.parent / "audio" / "narration.mp3"
VOICE_PATH = VOICE_DIR / "voice.wav"
WORDS_PATH = VOICE_DIR / "words.json"


def fail(message):
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def audio_duration(path):
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        check=True, capture_output=True, text=True
    )
    return float(result.stdout.strip())


def build_word_timings(text, duration):
    tokens = re.findall(r"\S+", text, flags=re.UNICODE)
    if not tokens:
        fail("templates/voice/narration.txt is empty.")

    # Reserve natural pauses after punctuation, then distribute the remaining
    # spoken time by word length. These spans drive music ducking only.
    pauses = []
    weights = []
    for token in tokens:
        pauses.append(0.24 if re.search(r"[.!?][\"'”’)]*$", token) else
                      0.12 if re.search(r"[,;:][\"'”’)]*$", token) else 0.0)
        letters = re.sub(r"[^\w]", "", token, flags=re.UNICODE)
        weights.append(max(1, len(letters)) ** 0.82)

    available = max(0.1, duration - sum(pauses) - 0.25)
    total_weight = sum(weights)
    cursor = 0.12
    words = []
    for token, weight, pause in zip(tokens, weights, pauses):
        span = available * weight / total_weight
        start = cursor
        end = min(duration, start + span)
        words.append({"w": token, "s": round(start, 4), "e": round(end, 4)})
        cursor = end + pause

    # Keep the final word within the actual file duration.
    if words and words[-1]["e"] > duration:
        words[-1]["e"] = round(duration, 4)
    return words


def main():
    if not SOURCE_MP3.is_file():
        fail(f"Uploaded narration not found: {SOURCE_MP3}")
    if not TEXT_PATH.is_file():
        fail(f"Narration transcript not found: {TEXT_PATH}")

    text = TEXT_PATH.read_text(encoding="utf-8").strip()
    if not text:
        fail("templates/voice/narration.txt is empty.")

    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    duration = audio_duration(SOURCE_MP3)
    if duration <= 1:
        fail(f"Audio duration looks invalid: {duration:.2f} seconds")

    subprocess.run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(SOURCE_MP3), "-ar", "48000", "-ac", "2",
        "-c:a", "pcm_s24le", str(VOICE_PATH)
    ], check=True)

    words = build_word_timings(text, duration)
    WORDS_PATH.write_text(
        json.dumps(words, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8"
    )
    print(f"Uploaded narration converted: {VOICE_PATH}")
    print(f"Estimated word timing entries: {len(words)}")
    print(f"Source speech duration: {duration:.2f} seconds")
    print("No ElevenLabs API request or secret is required.")


if __name__ == "__main__":
    main()
