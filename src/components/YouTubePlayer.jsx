import { useState, useEffect, useRef } from 'react'

// Load the YouTube IFrame API 
function loadYTApi(onReady) {
    if (window.YT && window.YT.Player) {
        onReady();
        return;
    }

    if (!document.getElementById('yt-api-script')) {
        const tag = document.createElement('script');
        tag.id  = 'yt-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
    }

    // YouTube calls this global function when the API is ready
    window.onYouTubeIframeAPIReady = onReady;
}

function extractVideoId(url) {
    const match = url.match(/(?:v=|\/embed\/|\.be\/)([A-Za-z0-9_-]{11})/);
    return match ? match[1] : null;
}

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

export default function YouTubePlayer() {
    const [input,    setInput]    = useState('');
    const [videoId,  setVideoId]  = useState(null);
    const [error,    setError]    = useState('');
    const [speed,    setSpeed]    = useState(1);
    const [mirrored, setMirrored] = useState(false);

    const containerRef = useRef(null);  // div that YT replaces with an iframe
    const playerRef    = useRef(null);  // YT.Player instance

    function handleLoad() {
        const id = extractVideoId(input.trim());
        if (!id) {
            setError('Could not find a video ID in that URL.');
            return;
        }
        setError('');
        setVideoId(id);
    }

    useEffect(() => {
        if (!videoId) return

        loadYTApi(() => {
            if (playerRef.current) {
                playerRef.current.destroy()
                playerRef.current = null
            }

            playerRef.current = new window.YT.Player(containerRef.current, {
                videoId,
                playerVars: { rel: 0, modestbranding: 1 },
                events: {
                    onReady: (e) => {
                        e.target.setPlaybackRate(speed)
                    },
                },
            })
        })
    }, [videoId])

    function handleSpeedChange(s) {
        setSpeed(s)
        if (playerRef.current) playerRef.current.setPlaybackRate(s)
    }

    return (
        <div className="player-panel">
            <div className="url-row">
                <input
                    type="text"
                    placeholder="Paste YouTube URL"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLoad()}
                />
                <button onClick={handleLoad}>Load</button>
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {videoId && (
                <>
                    <div style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }}>
                        <div ref={containerRef} style={{ width: '100%', aspectRatio: '16/9' }} />
                    </div>

                    <div className="controls">
                        <div className="control-group">
                            <span>Speed</span>
                            {SPEEDS.map(s => (
                                <button
                                    key={s}
                                    className={speed === s ? 'active' : ''}
                                    onClick={() => handleSpeedChange(s)}
                                >
                                    {s}×
                                </button>
                            ))}
                        </div>

                        <div className="control-group">
                            <span>Mirror</span>
                            <button onClick={() => setMirrored(m => !m)}>
                                {mirrored ? 'On' : 'Off'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}