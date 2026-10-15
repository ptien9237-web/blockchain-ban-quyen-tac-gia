# BookChain Library

Digital Library & Blockchain Copyright Registry

## Project Overview

BookChain is a digital library platform that combines a premium reading experience with an immutable blockchain-based copyright registration system. 

**"LIBRARY FIRST, COPYRIGHT SECOND, BLOCKCHAIN UNDERNEATH."**

This platform feels like an official cultural archive, where the reading experience is paramount, but every work's authenticity and ownership can be independently verified via blockchain.

## Setup & Installation

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## Architecture (Frontend MVP)

- **Framework**: React + TypeScript + Vite
- **Routing**: React Router DOM
- **Styling**: Vanilla CSS with Design Tokens (`src/index.css`)
- **Icons**: Lucide React
- **Translation System**: Centralized Context (`I18nContext`) supporting English (Default) and Vietnamese, persisting via `localStorage`.
- **Theme System**: Centralized Context (`ThemeContext`) supporting Light (Default) and Dark, persisting via `localStorage` and `index.css` `.dark` modifiers.
- **Mock Data**: A simulated data layer is implemented in `src/services/mockData.ts` to mock blockchain interactions and library content for this frontend phase.

## Implemented Features

- **Discover**: Browse the library, filter by category and copyright status.
- **Book Details**: View book metadata alongside a detailed, archival-style copyright record.
- **Verify Copyright**: Upload a file to calculate its cryptographic hash and check for matches on the registry (Mocked).
- **Register Copyright**: A multi-step process for authors to register their work, simulating wallet connection and IPFS upload.
- **Bilingual Support (EN/VI)**: Seamlessly switch between fully translated UI languages.
- **Light/Dark Mode**: Read comfortably in an "archival reading room" aesthetic in light mode, or a muted dark paper aesthetic at night.

## Current Limitations

- **No Real Blockchain**: This is a frontend prototype. Wallet connections, cryptographic hashing, and IPFS uploads are currently mocked.
- **No Backend**: Data is hardcoded in the frontend service layer.

## Next Phase

The next phase will involve developing the smart contracts, implementing IPFS for decentralized storage, and integrating `ethers.js` for real wallet connections and on-chain interactions.
