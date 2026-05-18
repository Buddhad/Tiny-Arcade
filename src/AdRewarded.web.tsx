// src/AdRewarded.web.tsx
// Safe fallback stub configuration for Web Browser testing
export const setupRewarded = (setAdLoaded: (loaded: boolean) => void, onEarnReward: () => void) => {
  // On the web, we automatically tell the app the ad is "loaded" so you can test the feature
  setAdLoaded(true);
  
  // Save the reward trigger globally to simulate clicking the ad on the web browser
  (window as any)._simulateWebReward = onEarnReward;

  return () => {};
};

export const showRewardedAd = (adLoaded: boolean) => {
  console.log("Rewarded Video Ad Skipped: Running on web simulation.");
  alert("Web Simulation: Rewarded Video watched! Awarding 1 extra life.");
  
  // Instantly trigger the reward function on the web browser so you can test your game logic
  if ((window as any)._simulateWebReward) {
    (window as any)._simulateWebReward();
  }
};
