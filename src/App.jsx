import { useState } from 'react'
import FilePlayer from './components/FilePlayer'
import YouTubePlayer from './components/YouTubePlayer'

function App() {
  const [tab, setTab] = useState('file');

  return (
    <div className="app">
      <div className="app-inner">
        <header className="app-header">
          <h1 className="app-title">Dance Practice</h1>
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

            {tab === 'file' && <FilePlayerHeader />}
            {tab === 'youtube' && <YouTubeHeader />}
          </div>
        </header>

        <div className="tab-content">
          {tab === 'file'    && <FilePlayer />}
          {tab === 'youtube' && <YouTubePlayer />}
        </div>
      </div>
    </div>
  )
}

// Placeholder header slots — actual file picking stays inside FilePlayer/YouTubePlayer
// These are just visual stubs so the header renders correctly before a file is chosen
function FilePlayerHeader() {
  return null; // FilePlayer renders its own chip inside the header slot via a portal pattern — skipped for now; file chip is inside FilePlayer
}

function YouTubeHeader() {
  return null;
}

export default App
