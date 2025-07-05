import { useEffect, useState, useRef } from 'react'
import './Firework.css'

const Firework = ({ firework }) => {
  const [particles, setParticles] = useState([])
  const [isExploded, setIsExploded] = useState(false)
  const animationRef = useRef()

  useEffect(() => {
    // Create particles based on firework effect
    const createParticles = () => {
      const particleCount = getParticleCount(firework.effect)
      const newParticles = []

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.2
        const velocity = getVelocity(firework.effect)
        const velocityMultiplier = 0.8 + Math.random() * 0.4 // Simplified velocity variation
        
        const particle = {
          id: i,
          x: firework.x,
          y: firework.y,
          vx: Math.cos(angle) * velocity * velocityMultiplier,
          vy: Math.sin(angle) * velocity * velocityMultiplier,
          life: 1.0,
          decay: getDecay(firework.effect),
          size: getParticleSize(firework.effect) + Math.random() * 2, // Reduced size variation
          color: getParticleColor(firework.color, firework.effect),
          trail: firework.effect === 'strobe' || firework.effect === 'crackling'
        }
        newParticles.push(particle)
      }

      setParticles(newParticles)
      setIsExploded(true)
    }

    // Initial explosion
    setTimeout(createParticles, 100)

    // Animation loop
    const animate = () => {
      setParticles(prevParticles => 
        prevParticles.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.2, // gravity
          vx: particle.vx * 0.99, // air resistance
          life: particle.life - particle.decay
        })).filter(particle => particle.life > 0)
      )

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [firework])

  const getParticleCount = (effect) => {
    switch (effect) {
      case 'brocade': return 40
      case 'strobe': return 30
      case 'chrysanthemum': return 50
      case 'peony': return 35
      case 'ring': return 24
      case 'crackling': return 35
      default: return 35
    }
  }

  const getVelocity = (effect) => {
    switch (effect) {
      case 'brocade': return 8
      case 'strobe': return 10
      case 'chrysanthemum': return 6
      case 'peony': return 9
      case 'ring': return 5
      case 'crackling': return 12
      default: return 8
    }
  }

  const getDecay = (effect) => {
    switch (effect) {
      case 'brocade': return 0.012
      case 'strobe': return 0.016
      case 'chrysanthemum': return 0.010
      case 'peony': return 0.014
      case 'ring': return 0.020
      case 'crackling': return 0.018
      default: return 0.012
    }
  }

  const getParticleSize = (effect) => {
    switch (effect) {
      case 'brocade': return 6
      case 'strobe': return 8
      case 'chrysanthemum': return 4
      case 'peony': return 7
      case 'ring': return 5
      case 'crackling': return 5
      default: return 6
    }
  }

  const getParticleColor = (baseColor, effect) => {
    if (effect === 'strobe') {
      return Math.random() > 0.5 ? baseColor : '#ffffff'
    }
    if (effect === 'crackling') {
      return Math.random() > 0.7 ? '#ffd700' : baseColor
    }
    return baseColor
  }

  return (
    <div className="firework" style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none'
    }}>
      {!isExploded && (
        <div 
          className="firework-rocket"
          style={{
            position: 'absolute',
            left: firework.x,
            top: firework.y,
            width: '2px',
            height: '20px',
            backgroundColor: firework.color,
            animation: 'rocketTrail 0.1s ease-out'
          }}
        />
      )}
      
      {particles.map(particle => (
        <div
          key={particle.id}
          className={`particle ${firework.effect}`}
          style={{
            position: 'absolute',
            left: particle.x,
            top: particle.y,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            borderRadius: '50%',
            opacity: particle.life,
            boxShadow: particle.trail 
              ? `0 0 ${particle.size * 2}px ${particle.color}` 
              : `0 0 ${particle.size * 1.5}px ${particle.color}`,
            transform: `scale(${0.8 + particle.life * 0.4})` // Simplified scaling
          }}
        />
      ))}
    </div>
  )
}

export default Firework
