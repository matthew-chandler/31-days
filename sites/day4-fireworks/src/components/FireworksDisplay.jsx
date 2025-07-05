import Firework from './Firework'
import './FireworksDisplay.css'

const FireworksDisplay = ({ fireworks }) => {
  return (
    <div className="fireworks-container">
      {fireworks.map(firework => (
        <Firework
          key={firework.id}
          firework={firework}
        />
      ))}
    </div>
  )
}

export default FireworksDisplay
