// src/adConfig.ts
import { TestIds } from 'react-native-google-mobile-ads';

/**
 * TOGGLE MODE CONFIGURATION FLAG
 * true  -> Uses real, unique live Google AdMob IDs for publishing.
 * false -> Uses global test IDs so you can safely play and test locally without account bans.
 */
const IS_PRODUCTION = false; 

export const AD_KEYS = {
  // 1. Interstitial ID Slot (Used in Memory, Tic-Tac-Toe, and RPS)
  interstitial: IS_PRODUCTION 
    ? "ca-app-pub-9234471974778013/4132719686" // Your live ID
    : TestIds.INTERSTITIAL,

  // 2. Rewarded Video ID Slot (Used in Snake and 2048)
  rewarded: IS_PRODUCTION 
    ? "ca-app-pub-9234471974778013/6564504967" // Your live ID
    : TestIds.REWARDED,

  // 3. Banner Ad ID Slot (Used in Memory, Tic-Tac-Toe, and 2048)
  banner: IS_PRODUCTION 
    ? "ca-app-pub-9234471974778013/2713872403" // Your live ID
    : TestIds.BANNER,
};
