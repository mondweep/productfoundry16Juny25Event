# Live Conditions Frontend

A real-time monitoring dashboard for weather, fire, flood, and traffic conditions across Australia and New Zealand.

## Features

- **Interactive Map**: Leaflet-based map with data layers
- **Real-time Updates**: WebSocket connection for live data
- **User Reports**: Community reporting with image upload
- **PWA Support**: Works offline and installable on mobile
- **Push Notifications**: Alerts for severe weather and emergencies
- **Responsive Design**: Optimized for desktop and mobile

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Leaflet** - Interactive maps
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Socket.io** - Real-time communication

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Update environment variables in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/          # React components
│   ├── Auth/           # Authentication components
│   ├── Layout/         # Layout components
│   ├── Map/            # Map-related components
│   ├── Notifications/  # Notification components
│   └── Reports/        # User reporting components
├── hooks/              # Custom React hooks
├── services/           # API and WebSocket services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Key Components

### Map System
- `MapContainer`: Main map wrapper with SSR handling
- `LeafletMap`: Core Leaflet integration
- `DataLayers`: Renders data points on map
- `LayerControls`: Layer toggle and filtering

### Real-time Features
- `useWebSocket`: WebSocket connection management
- `useApi`: API integration with loading states
- `useStore`: Zustand stores for state management

### PWA Features
- Service worker for offline functionality
- Push notification support
- Installable on mobile devices
- Background sync for offline reports

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | Yes |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox access token | Optional |
| `NEXT_PUBLIC_VAPID_KEY` | Push notification VAPID key | Optional |

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks
- `npm test` - Run tests

## PWA Installation

The app can be installed on mobile devices and desktop:

1. Visit the site in a supported browser
2. Look for "Install" prompt or "Add to Home Screen"
3. Follow browser-specific installation steps

## Browser Support

- Chrome 80+
- Firefox 74+
- Safari 13+
- Edge 80+

## Performance

- Code splitting with Next.js
- Image optimization
- Service worker caching
- WebSocket connection with reconnection
- Efficient map rendering with clustering

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test on both desktop and mobile
4. Ensure PWA functionality works
5. Update documentation as needed