import { useState } from 'react'
import FilePlayer from './components/FilePlayer'
import YouTubePlayer from './components/YouTubePlayer'

function App() {
  const [tab, setTab] = useState('file');

  return (
    <div className='app'>
      <h1 className='title'> Dance Practice Tool</h1>
      <div className='tab-bar'>
        <button 
          className={`tab-btn ${tab === 'file' ?  'active' : ''}`}
          onClick={() => setTab('file')}
        >
          Upload File
        </button>
        <button
          className={`tab-btn ${tab === 'youtube' ? 'active' : ''}`}
          onClick={() => setTab('youtube')}
        >
          YouTube Link
        </button>
      </div>

      <div className="tab-content">
        {tab === 'file'    && <FilePlayer />}
        {tab === 'youtube' && <YouTubePlayer />}
      </div>

    </div>
  )
}

export default App
