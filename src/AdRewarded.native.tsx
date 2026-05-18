// src/AdRewarded.native.tsx
import { AdEventType, RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

// Safe instantiation for native platforms (Android) using the Google Rewarded Test ID
const rewarded = RewardedAd.createForAdRequest(TestIds.REWARDED, {
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
    rewarded.load(); // Preload the next rewarded video in the background
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
