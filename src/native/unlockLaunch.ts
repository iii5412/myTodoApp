import { registerPlugin } from '@capacitor/core';

export interface UnlockStatus {
  /** The user switched "open on unlock" on. */
  enabled: boolean;
  /** "Display over other apps": what lets the app open itself from the background. */
  overlayGranted: boolean;
  /** Keeps the phone's battery saver from stopping the unlock watcher. */
  batteryUnrestricted: boolean;
}

interface UnlockLaunchPlugin {
  getStatus(): Promise<UnlockStatus>;
  setEnabled(options: { enabled: boolean }): Promise<UnlockStatus>;
  openOverlaySettings(): Promise<void>;
  openBatterySettings(): Promise<void>;
}

/** Native side: android/app/src/main/java/com/iii5412/mytodo/UnlockLaunchPlugin.java */
export const UnlockLaunch = registerPlugin<UnlockLaunchPlugin>('UnlockLaunch');
