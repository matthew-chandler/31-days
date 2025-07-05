import { useState, useCallback, useEffect, useRef } from 'react'
import FireworksDisplay from './components/FireworksDisplay'
import './App.css'

function App() {
  const [fireworks, setFireworks] = useState([])
  const autoFireworkTimerRef = useRef(null)

  const createFirework = useCallback((x, y) => {
    const colors = ['#ff0000', '#0066ff', '#ffd700', '#00ff00', '#9966ff', '#ff8800', '#ffffff']
    const effects = ['brocade', 'strobe', 'chrysanthemum', 'peony', 'ring', 'crackling']
    
    const newFirework = {
      id: Date.now() + Math.random(),
      x,
      y,
      color: colors[Math.floor(Math.random() * colors.length)],
      effect: effects[Math.floor(Math.random() * effects.length)],
      particles: []
    }
    
    setFireworks(prev => [...prev, newFirework])
    
    // Remove firework after animation completes (optimized timing)
    setTimeout(() => {
      setFireworks(prev => prev.filter(fw => fw.id !== newFirework.id))
    }, 3000)
  }, [])

  const createRandomFirework = useCallback(() => {
    // Generate random position within the viewport
    const x = Math.random() * window.innerWidth
    const y = Math.random() * (window.innerHeight * 0.7) + (window.innerHeight * 0.1) // Keep in upper 70% of screen
    createFirework(x, y)
  }, [createFirework])

  const scheduleNextAutoFirework = useCallback(() => {
    // Random interval between 0-1.5 seconds
    const nextInterval = Math.random() * 1500
    autoFireworkTimerRef.current = setTimeout(() => {
      createRandomFirework()
      scheduleNextAutoFirework() // Schedule the next one
    }, nextInterval)
  }, [createRandomFirework])

  useEffect(() => {
    // Start the automatic fireworks
    scheduleNextAutoFirework()

    // Cleanup timer on unmount
    return () => {
      if (autoFireworkTimerRef.current) {
        clearTimeout(autoFireworkTimerRef.current)
      }
    }
  }, [scheduleNextAutoFirework])

  const handleClick = useCallback((e) => {
    const rect = e.target.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    createFirework(x, y)
  }, [createFirework])

  return (
    <div className="app" onClick={handleClick}>
      <FireworksDisplay fireworks={fireworks} />
      <div className="attribution">
        <a href="https://www.vecteezy.com/free-vector/skyscraper">Skyscraper Vectors by Vecteezy</a>
      </div>
      <footer className="footer">
        <p>Learn more about this site and more on <a href="https://www.machandler.com/31-days/" target="_blank" rel="noopener noreferrer">my website</a></p>
      </footer>
    </div>
  )
}

export default App
