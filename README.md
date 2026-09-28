# Daggerfall Save Editor

A desktop application for editing save files from The Elder Scrolls II: Daggerfall.

## Features

- Edit character stats, skill levels, and attributes
- Reassign Primary, Major, and Minor class skills
- Modify inventory items, gold, and spells
- Tweak quest variables and progress
- Change faction reputations

## Installing on macOS

Download the DMG for your Mac from the [releases page](https://github.com/Lysunder/DaggerfallSaveEditor/releases): `arm64` for Apple Silicon (M1 and later), `x64` for Intel.

The app is not notarized by Apple, so macOS blocks it the first time you open it. After dragging it to Applications:

1. Open the app once and dismiss the warning.
2. Go to **System Settings → Privacy & Security**, scroll down, and click **Open Anyway** next to the message about the app.

If macOS says the app "is damaged and can't be opened", remove the download quarantine flag in Terminal and open it again:

```bash
xattr -cr "/Applications/Daggerfall Unity Save Editor.app"
```

## Tech Stack

This project is built using:

- **Electron** for the desktop application framework
- **React 19** + **TypeScript** for the user interface
- **Vite** as the build tool and development server
- **Material UI (MUI)** for UI components and styling
- **Zustand** for state management
- **Immer** for immutable state updates
- **Oxlint** for fast JavaScript/TypeScript linting

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (latest LTS recommended)
- npm or yarn

### Installation

Clone the repository and install the dependencies:

```bash
npm install
```

### Development

Start the development server with hot module replacement (HMR):

```bash
npm run dev
```

### Building for Production

To build the application for production:

```bash
npm run build
```

To create a distributable package for your operating system:

```bash
npm run build:dist
```

### Code Quality & Preview

To run the linter:

```bash
npm run lint
```

To preview the production build locally:

```bash
npm run preview
```

## License

This project is open-source. Please see the LICENSE file for details.
