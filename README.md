# Dance Practice Tool

A browser-based tool for drilling choreography. Load a video file or paste a YouTube link, then slow it down, mirror it, and loop a specific section — all without leaving the page.

## Features

- **File player** — upload any video or audio file; plays directly in the browser via blob URLs (no upload, no server)
- **YouTube player** — paste any YouTube link and control playback with the same interface
- **Speed control** — 0.25× to 2.0× in 0.05× steps via a smooth slider
- **Mirror** — flip the video horizontally so you can learn from a mirror perspective
- **A/B loop** — drag two markers on a timeline to set a loop region; the player snaps back to A whenever playback reaches B
- **Draggable playhead** — seek by dragging directly on the loop bar timeline
- **Fullscreen** — custom overlay UI that fades out when inactive, with frosted-glass controls at the bottom
- **Status badges** — "Mirrored" and speed badges overlaid on the video corner in both normal and fullscreen views

## Tech Stack

- React + Vite
- Vanilla CSS (no UI library)
- YouTube IFrame API (via adapter pattern — shared controls work identically for both file and YouTube playback)

## Getting Started

```bash
nvm use 20        # Node 20+ required
npm install
npm run dev
```

> **Note:** `create-vite@9` requires Node 20+. If you see a `styleText` error, run `nvm install 20 && nvm alias default 20`.

## Project Structure

```
src/
  components/
    FilePlayer.jsx       # File/audio player
    YouTubePlayer.jsx    # YouTube IFrame API player
    LoopBar.jsx          # Draggable A/B loop timeline
    PlayerControls.jsx   # Play/pause, volume, speed, mirror, fullscreen
  index.css              # All styles (design tokens, layout, fullscreen)
  App.jsx                # Tab toggle between File and YouTube modes
  main.jsx
```

## Planned

- BPM detector (Web Audio API)
- Beat counter / metronome with adjustable 1–8 count overlay
