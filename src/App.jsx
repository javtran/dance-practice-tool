import { useState, useRef, useEffect } from 'react'
import FilePlayer from './components/FilePlayer'
import YouTubePlayer from './components/YouTubePlayer'
import { IconGitHub } from './components/icons'

function App() {
  const [tab, setTab] = useState('file');
  const playerRef = useRef(null);

  // Global keyboard shortcuts — fires on document, skips when typing in an input
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't steal keys from input / textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const p = playerRef.current;
      if (!p) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          p.isPaused() ? p.play() : p.pause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          p.seek(p.getTime() + (e.shiftKey ? 1 : 5));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          p.seek(p.getTime() - (e.shiftKey ? 1 : 5));
          break;
        case 'ArrowUp':
          e.preventDefault();
          p.setVolume(Math.round(Math.min(1, p.getVolume() + 0.1) * 10) / 10);
          break;
        case 'ArrowDown':
          e.preventDefault();
          p.setVolume(Math.round(Math.max(0, p.getVolume() - 0.1) * 10) / 10);
          break;
        case 'm':
        case 'M':
          p.toggleMute();
          break;
        case 'f':
        case 'F':
          p.toggleFullscreen();
          break;
        case 'l':
        case 'L':
          p.toggleLoop();
          break;
        default:
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app">
      <div className="app-inner">
        <header className="app-header">
          <h1 className="app-title">Dance Practice Tool</h1>
          <div className="header-right">
            <div className="source-toggle" role="group" aria-label="Source">
              <button
                className={`source-btn${tab === 'file' ? ' active' : ''}`}
                onClick={() => setTab('file')}
                aria-pressed={tab === 'file'}
              >
                File
              </button>
              <button
                className={`source-btn${tab === 'youtube' ? ' active' : ''}`}
                onClick={() => setTab('youtube')}
                aria-pressed={tab === 'youtube'}
              >
                YouTube
              </button>
            </div>
          </div>
        </header>

        <div className="tab-content">
          {tab === 'file'    && <FilePlayer ref={playerRef} />}
          {tab === 'youtube' && <YouTubePlayer ref={playerRef} />}
        </div>

        <footer className="app-footer">
          <span className="footer-left">
            Built by <a href="https://www.jackson-tran.com" target="_blank" rel="noreferrer">Jackson Tran</a>
          </span>
          <div className="footer-right">
            <a
              className="footer-link"
              href="https://github.com/javtran/dance-practice-tool"
              target="_blank"
              rel="noreferrer"
            >
              <IconGitHub />
              GitHub
            </a>
            <a
              className="footer-link"
              href="https://github.com/javtran/dance-practice-tool/issues"
              target="_blank"
              rel="noreferrer"
            >
              Report a bug
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
