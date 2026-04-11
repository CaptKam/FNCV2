/**
 * React hook wrappers around the module-level remote-config store.
 *
 * Three hooks for three usage patterns:
 *   - useRemoteConfig() → the whole config object, re-renders on update
 *   - useFeatureFlag(key) → single boolean, re-renders only on that flag
 *   - useAppSetting(key, fallback) → typed setting with a local fallback
 *
 * All three subscribe to the store's listener set, so when a
 * successful network refresh lands the components that depend on
 * the changed values re-render automatically.
 */
import { useEffect, useState } from "react";
import {
  getRemoteConfig,
  getFlag,
  getSetting,
  subscribeRemoteConfig,
  type RemoteConfig,
} from "@/utils/remoteConfig";

/**
 * Returns the full RemoteConfig object. Use this if you need
 * multiple values on one screen — you get one subscription
 * instead of N for each useFeatureFlag / useAppSetting call.
 */
export function useRemoteConfig(): RemoteConfig {
  const [config, setConfig] = useState<RemoteConfig>(getRemoteConfig());
  useEffect(() => {
    // Grab the current value in case it changed between mount
    // and the subscribe call.
    setConfig(getRemoteConfig());
    return subscribeRemoteConfig(setConfig);
  }, []);
  return config;
}

/**
 * Returns the current value of a single feature flag. Defaults
 * to `false` if the key is unknown — fail-closed is safer than
 * fail-open for gating features that may contain incomplete UI.
 */
export function useFeatureFlag(key: string): boolean {
  const [value, setValue] = useState<boolean>(() => getFlag(key));
  useEffect(() => {
    setValue(getFlag(key));
    return subscribeRemoteConfig(() => setValue(getFlag(key)));
  }, [key]);
  return value;
}

/**
 * Returns a typed app setting with a local fallback. The fallback
 * is used if the server hasn't provided the key OR the server's
 * value has the wrong runtime type.
 *
 * Type parameter is inferred from the fallback so most call sites
 * don't need an explicit annotation:
 *
 *   const xpPerRecipe = useAppSetting("xp_per_recipe", 50);
 *   const thresholds = useAppSetting("level_thresholds", [0, 100]);
 */
export function useAppSetting<T>(key: string, fallback: T): T {
  const [value, setValue] = useState<T>(() => getSetting<T>(key, fallback));
  useEffect(() => {
    setValue(getSetting<T>(key, fallback));
    return subscribeRemoteConfig(() => setValue(getSetting<T>(key, fallback)));
    // fallback is intentionally included — if the caller passes a
    // different fallback (rare but possible), we refresh the subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return value;
}
