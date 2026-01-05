# Spacely - Cosmic Social Hub 🚀

A stunning, mobile-responsive decentralized social platform built on Movement blockchain featuring events, community chat, profiles, and UPS rewards system.

## Features

### 📱 **Fully Mobile Responsive**
- **Adaptive Navigation**: Smart navigation that transforms on mobile with icon-first layout
- **Touch-Optimized**: All interactive elements sized for easy touch interaction
- **Fluid Layouts**: Grid layouts that stack beautifully on smaller screens
- **Mobile-First Typography**: Scaled fonts for optimal readability on any device

### 🏠 **Home - News Feed**
- Latest platform updates and announcements
- Featured news cards with gradient backgrounds
- Category tags and timestamps

### 📅 **Calendar - Events & Schedules**
- Interactive calendar grid
- Create and manage events
- Filter by event type
- Upcoming events list with genres

### 👤 **Profile - User Management**
- User profile with stats (tokens sent/received)
- Contacts management
- Private messaging system
- Status indicators

### 🌍 **Community - Social Hub**
- **UPS Leaderboard**: Top users with streaks and points
- **Public Chat**: Real-time community messaging
- Anonymous posting option
- Live user count

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Vanilla CSS with CSS Variables
- **Routing**: React Router DOM
- **Fonts**: Inter & Space Grotesk (Google Fonts)
- **Blockchain**: Movement/Aptos (integration ready)

## Mobile Responsive Breakpoints

The app is optimized for the following breakpoints:

- **Desktop**: 1200px+ (full layout)
- **Tablet**: 768px - 1200px (medium layout)
- **Mobile**: 480px - 768px (stacked layout)
- **Small Mobile**: < 480px (compact layout)

### Responsive Features by Page

#### Navigation
- Desktop: Full horizontal navigation with labels
- Tablet: Compact navigation with smaller spacing
- Mobile: Icon-focused bottom navigation
- Small Mobile: Icon-only navigation

#### Home Page
- Desktop: Multi-column news grid
- Tablet: 2-column grid
- Mobile: Single column stack
- Adjustable card heights and padding

#### Calendar Page
- Desktop: Sidebar + calendar + events (3-column)
- Tablet: Stacked sidebar, calendar side-by-side
- Mobile: Full-width stacked layout
- Touch-friendly calendar grid spacing
- Mobile-optimized modal forms

#### Profile Page
- Desktop: Profile card + tabs side-by-side
- Tablet: Centered profile card, full-width tabs
- Mobile: Stacked layout
- Smaller avatar and adjusted stats on mobile

#### Community Page
- Desktop: Leaderboard + chat side-by-side
- Tablet: Narrower leaderboard
- Mobile: Stacked leaderboard and chat
- Adjusted chat height for mobile screens
- Full-width anonymous toggle on small screens

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

\`\`\`bash
cd frontend
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

The app will run at `http://localhost:5173`

### Build

\`\`\`bash
npm run build
\`\`\`

## Wallet Integration

The app is ready for wallet integration. Placeholder functions are in place in `App.tsx`:
- `connectWallet()` - Connect to Movement/Aptos wallet
- `disconnectWallet()` - Disconnect wallet

To integrate with actual wallet:
1. Install wallet adapter: `npm install @aptos-labs/wallet-adapter-react`
2. Replace mock wallet functions with real wallet calls
3. Update blockchain interaction functions

## Blockchain Integration

The frontend is structured to connect with the following Move modules:

- `spacely::profile` - User profiles and contacts
- `spacely::space` - Event creation and calendar
- `spacely::chat` - Public and private messaging
- `spacely::ups` - UPS point system and leaderboard

## Design System

### Colors
- Primary: Purple/Blue gradient (`#667eea` → `#764ba2`)
- Accent: Pink gradient (`#f093fb` → `#f5576c`)
- Background: Dark theme (`#0a0a0f`, `#13131a`, `#1a1a24`)

### Typography
- Primary: Inter (body text)
- Display: Space Grotesk (headings)

### Effects
- Glassmorphism backgrounds
- Smooth transitions and animations
- Gradient overlays
- Floating animations

## Mobile Testing

Test the responsive design by:
1. Using browser DevTools device mode
2. Resizing browser window
3. Testing on actual mobile devices

Key mobile interactions to test:
- Navigation switching
- Calendar grid touch targets
- Chat input and scrolling
- Modal forms on mobile
- Button touch areas

## Performance

The app is optimized for performance:
- CSS variables for consistent theming
- Minimal JavaScript bundle size
- Optimized animations
- Lazy-loaded routes (can be added)

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 13+, Chrome Android

## Contributing

This is a demonstration project. For production use:
1. Add actual wallet integration
2. Connect to deployed Move modules
3. Add error handling and loading states
4. Implement real-time chat with WebSockets
5. Add authentication and session management

## License

MIT

---

Built with ⚡ by the Spacely team
