// ============================================================================
// File: apps/mobile/index.ts
// Why: Entry point for Expo. Imports global CSS for NativeWind, then
//      registers the root App component.
// ============================================================================

import './global.css';
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
