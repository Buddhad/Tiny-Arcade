// src/AdRewarded.native.tsx
import { AdEventType, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';

// IMPORT YOUR CENTRAL AD CONFIG KEYS:
import { AD_KEYS } from './adConfig';

// CHANGED: Pulled keys dynamically from your centralized mapper configuration file
const rewarded = RewardedAd.createForAdRequest(AD_KEYS.rewarded, {
  requestNonPersonalizedAdsOnly: true,
});

export const setupRewarded = (setAdLoaded: (loaded: boolean) => void, onEarnReward: () => void) => {
  const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
    setAdLoaded(true);
  });

  const unsubscribeEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
    onEarnReward(); // Fires the game function to revive the player
  });

  const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
    setAdLoaded(false);
    rewarded.load(); // Preload the next rewarded video in the background for later
  });

  rewarded.load();

  return () => {
    unsubscribeLoaded();
    unsubscribeEarned();
    unsubscribeClosed();
  };
};

export const showRewardedAd = (adLoaded: boolean) => {
  if (adLoaded) {
    rewarded.show();
  }
};
