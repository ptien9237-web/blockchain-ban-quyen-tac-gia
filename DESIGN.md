# DESIGN SYSTEM: THE ARCHIVAL READING ROOM

## Visual Identity
The interface is designed as an "Archival Reading Room". It rejects the standard Web3/Crypto aesthetic (neon, dark glass, gradients) in favor of academic rigor and publishing tradition.

## Typography
- **Serif**: `Libre Baskerville` for headings, titles, and reading texts. Conveys tradition, permanence, and editorial quality.
- **Sans-Serif**: `Public Sans` for UI elements, metadata, and controls. Clean and utilitarian.
- **Monospace**: `Space Mono` for hashes, IDs, and blockchain records.

## Light Theme (Default)
- **Background**: `#F7F5F0` (Ivory Paper)
- **Surface**: `#FFFFFF` (White Paper)
- **Ink Primary**: `#1A1A1A` (Charcoal)
- **Ink Muted**: `#666666` (Faded Ink)
- **Border**: `#E0DCD3`
- **Interactive**: `#2C3E50` (Navy/Slate)
- **Accent**: `#D32F2F` (Library Vermilion - for critical actions or highlights)

## Dark Theme
An "archival reading room at night" — maintaining the identity but inverted with carefully controlled contrast.
- **Background**: `#161616` (Deep Charcoal)
- **Surface**: `#1C1C1C` (Darker Paper)
- **Ink Primary**: `#EAE6DC` (Warm Off-White)
- **Ink Muted**: `#A39E93` 
- **Border**: `#333333`
- **Interactive**: `#B0C4DE` (Light Steel Blue)
- **Accent**: `#9A2424` (Muted Vermilion)

## Components
- **Borders**: Thin, structured lines dividing content like a physical ledger (`1px solid var(--color-border)`).
- **Cards**: Minimal shadow (`var(--shadow-sm)`), sharp or slightly rounded corners (`2px`). 
- **Status Badges**: Use icons + color + label (e.g., `Shield` + `text-success` + "VERIFIED") for maximum accessibility.
- **Global Nav**: Contains non-obtrusive, minimal Language and Theme toggle icons that persist state locally.
