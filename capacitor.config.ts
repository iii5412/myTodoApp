import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iii5412.mytodo',
  appName: '할 일',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    // Self-hosted screen updates (src/lib/liveUpdate.ts). Every Capgo cloud
    // endpoint is blanked so the app never reports to or polls a third party.
    CapacitorUpdater: {
      autoUpdate: false,
      updateUrl: '',
      statsUrl: '',
      channelUrl: '',
      allowModifyUrl: false,
      appReadyTimeout: 10000,
      resetWhenUpdate: true,
      autoDeleteFailed: true,
      autoDeletePrevious: true,
    },
  },
};

export default config;
