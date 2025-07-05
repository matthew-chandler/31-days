# 🎆 Interactive Fireworks React Application

A beautiful, interactive fireworks display built with React and Vite. Click anywhere on the screen to create stunning fireworks with various colors and effects!

## ✨ Features

- **Interactive Fireworks**: Click anywhere to create fireworks at that location
- **Multiple Colors**: Red, blue, gold, green, purple, orange, and white fireworks
- **Various Effects**: 
  - **Brocade**: Long trailing particles with elegant trails
  - **Strobe**: Blinking, flashing particles
  - **Chrysanthemum**: Delicate, small burst patterns
  - **Peony**: Round bursts with soft glows
  - **Ring**: Particles that form ring patterns
  - **Crackling**: Irregular, sparkling effects
- **Realistic Physics**: Gravity, air resistance, and particle decay
- **Smooth Animations**: Built with requestAnimationFrame for 60fps performance
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites
- Node.js (v20.19.0 or higher recommended)
- npm

### Installation
1. Clone or download this project
2. **Add background image**: Place your `cityscape_night.jpg` image in the `src/assets/` folder for the city skyline background
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application
```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173` to see the fireworks display.

### Building for Production
```bash
npm run build
```

## 🎮 How to Use

1. Open the application in your browser
2. Click anywhere on the dark sky background
3. Watch as beautiful fireworks explode at your click location!
4. Each firework will have a random color and effect

## 🛠️ Technical Details

- **Framework**: React 18 with modern hooks
- **Build Tool**: Vite for fast development and building
- **Styling**: CSS3 animations and keyframes
- **Performance**: Optimized with requestAnimationFrame and proper cleanup
- **Physics**: Custom particle system with gravity and air resistance

## 🎨 Firework Effects

Each firework randomly selects from these effects:

- **Brocade**: Creates long, elegant trails behind particles
- **Strobe**: Particles blink on and off rapidly
- **Chrysanthemum**: Small, delicate burst with fine particles
- **Peony**: Large, round explosion with soft glow
- **Ring**: Particles arranged in circular patterns
- **Crackling**: Irregular, sparkling particles that rotate and scale

## 📁 Project Structure

```
src/
├── components/
│   ├── FireworksDisplay.jsx    # Container for all fireworks
│   ├── FireworksDisplay.css
│   ├── Firework.jsx           # Individual firework component
│   └── Firework.css           # Firework animations and effects
├── App.jsx                    # Main application component
├── App.css                    # Main application styling
├── index.css                  # Global styles
└── main.jsx                   # Application entry point
```

## 🖼️ Background Image

The application is designed to use a nighttime cityscape background image. To get the full visual experience:

1. **Add your cityscape image**: Place a file named `cityscape_night.jpg` in the `src/assets/` folder
2. **Recommended image specs**: 
   - **Resolution**: 1920x1080 or higher
   - **Format**: JPG or PNG
   - **Style**: Dark nighttime city skyline silhouette
   - **Aspect ratio**: 16:9 or wider landscape

If no background image is provided, the application will fall back to a CSS-generated city silhouette effect.

## 🎯 Perfect for

- Independence Day celebrations
- New Year's Eve displays
- Interactive demos
- Learning React animations
- Entertainment applications

Enjoy the show! 🎆✨
