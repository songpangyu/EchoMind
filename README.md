# EchoMind

A beautiful dream journal app with AI-powered insights, built with React Native.

## Design Theme

Natural healing dark theme with:
- Colors: Deep teal (#1e3a3a), Mint green (#b5d9a8), Soft teal (#8bb4ab)
- Atmosphere: Mysterious yet gentle, serene with vitality
- Effects: Floating fireflies/light particles, soft fog effects, breathing animations
- Materials: Glass morphism, soft gradients, low saturation

## Features

### Main Screens (5 Tabs)
1. **Home** - Today's dream cards, AI interpretation, daily suggestions, sleep data
2. **Record** - Voice recording interface, AI image generation, tags and mood
3. **Journal** - Historical dreams, search/filter, calendar/list views
4. **Insights** - Statistics, trend charts, personalized discoveries
5. **Community** - Browse shared dreams, social interactions

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- React Native development environment
- For iOS: Xcode and CocoaPods
- For Android: Android Studio and SDK

### Installation

1. Install dependencies:
```bash
cd EchoMind
npm install
```

2. For iOS (Mac only):
```bash
cd ios
pod install
cd ..
```

3. Run the app:

For iOS:
```bash
npm run ios
```

For Android:
```bash
npm run android
```

## Project Structure

```
EchoMind/
├── src/
│   ├── screens/          # Main screen components
│   │   ├── HomeScreen.tsx
│   │   ├── RecordScreen.tsx
│   │   ├── JournalScreen.tsx
│   │   ├── InsightsScreen.tsx
│   │   └── CommunityScreen.tsx
│   ├── components/       # Reusable components
│   │   ├── GlassCard.tsx
│   │   └── FloatingParticles.tsx
│   ├── navigation/       # Navigation setup
│   │   ├── TabNavigator.tsx
│   │   └── types.ts
│   └── theme/           # Design system
│       ├── colors.ts
│       ├── spacing.ts
│       ├── typography.ts
│       └── index.ts
├── App.tsx              # Root component
└── index.js            # Entry point
```

## Tech Stack

- React Native 0.76.5
- React Navigation (Bottom Tabs + Stack)
- React Native Reanimated (Animations)
- TypeScript
- React Native Gesture Handler
- React Native SVG
- React Native Linear Gradient

## Notes

This is a demonstration app for an emerging trends school project. It showcases the UI/UX design and does not include full backend implementation.

## Running on Physical Device

### iOS
1. Open `ios/EchoMind.xcworkspace` in Xcode
2. Select your device
3. Click Run

### Android
1. Enable USB debugging on your device
2. Connect via USB
3. Run `npm run android`

## License

MIT
