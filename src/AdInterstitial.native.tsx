// src/AdInterstitial.native.tsx
import React from 'react';
// IMPORT THE NATIVE BANNER MODULES HERE
import { InterstitialAd, AdEventType, TestIds, BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

// Safe instantiation for native platforms (Android/iOS)
const interstitial = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL, {
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

// ADDED: Real native Google Banner view for Android / iOS physical device builds
export const AdBannerView = () => {
  return (
    <BannerAd
      unitId={TestIds.BANNER} // Uses safe Google test banner unit ID
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: true }}
    />
  );
};
