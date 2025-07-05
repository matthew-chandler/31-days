import { useState, useCallback } from 'react'
import FireworksDisplay from './components/FireworksDisplay'
import './App.css'

function App() {
  const [fireworks, setFireworks] = useState([])

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
    </div>
  )
}

export default App
