# Automated voice, music and sound effects

The full render workflow uses ElevenLabs for narration and the existing original Python audio engine for music, sound effects, ducking and final mastering.

## One-time GitHub setup

In the repository, open **Settings → Secrets and variables → Actions → New repository secret** and add:

- `ELEVENLABS_API_KEY`: your ElevenLabs API key.
- `ELEVENLABS_VOICE_ID`: the ID of the voice you want to use.

Never put either value in a source file or commit it to Git.

## Narration

Edit `templates/voice/narration.txt`. The included Portuguese narration is the starter script for “The Bridge That Fell for a Song”. The generator calls ElevenLabs Multilingual v2, saves a 48 kHz stereo WAV and builds word-level timing data from the API's character timestamps.

## Full render

Open **Actions → BridgeShort full render with audio → Run workflow**. The job generates the voice, renders the existing original music and scene-synchronized SFX, ducks the music under speech, masters the mix, and renders the complete 1080 × 1920 / 30 fps video with audio.

The three audio layers are mixed by the project's existing DSP engine. The resulting master is copied to `public/audio/mix.wav` and embedded in the MP4 by Remotion.

## Costs and privacy

ElevenLabs usage is billed or deducted according to the user's ElevenLabs plan. GitHub Actions stores the generated artifacts for the configured retention period. The API key and voice ID are read only from GitHub Actions secrets.
