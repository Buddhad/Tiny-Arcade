// src/AdInterstitial.native.tsx
import React from 'react';
// CHANGED: Removed TestIds from imports since keys are now loaded dynamically
import { InterstitialAd, AdEventType, BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

// IMPORT YOUR CENTRAL AD CONFIG KEYS:
import { AD_KEYS } from './adConfig';

// CHANGED: Pulled keys dynamically from your centralized mapper configuration file
const interstitial = InterstitialAd.createForAdRequest(AD_KEYS.interstitial, {
  requestNonPersonalizedAdsOnly: true,
});

export const setupInterstitial = (setAdLoaded: (loaded: boolean) => void) => {
  const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
    setAdLoaded(true);
  });

  const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    setAdLoaded(false);
    interstitial.load(); // Preload background slot
  });

  interstitial.load();

  return () => {
    unsubscribeLoaded();
    unsubscribeClosed();
  };
};

export const showInterstitialAd = (gamesCount: number, adLoaded: boolean) => {
  if (gamesCount % 3 === 0 && adLoaded) {
    interstitial.show();
  }
};

// Real native Google Banner view for Android / iOS physical device builds
export const AdBannerView = () => {
  return (
    <BannerAd
      unitId={AD_KEYS.banner} // CHANGED: Hooked up banner to pull live keys from central configuration mapper
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: true }}
    />
  );
};
