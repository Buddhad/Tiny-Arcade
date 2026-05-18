// src/AdInterstitial.web.tsx
import React from 'react';
import { View, Text } from 'react-native';

// Safe fallback stub configuration for Web Browser testing
export const setupInterstitial = (setAdLoaded: (loaded: boolean) => void) => {
  console.log("Ads skipped: Running on desktop web browser simulation.");
  return () => {}; // Return dummy cleaner lifecycle
};

export const showInterstitialAd = (gamesCount: number, adLoaded: boolean) => {
  // Silent fallback: no native overlays to evoke in a web window
};

// ADDED: Safe mock placeholder so your local desktop web browser doesn't crash
export const AdBannerView = () => {
  return (
    <View style={{ 
      height: 60, 
      backgroundColor: '#ddd', 
      justifyContent: 'center', 
      alignItems: 'center', 
      width: '100%',
      marginTop: 20,
      borderRadius: 8
    }}>
      <Text style={{ fontSize: 12, color: '#666', fontWeight: 'bold' }}>
        [AdMob Test Banner Placeholder]
      </Text>
    </View>
  );
};
