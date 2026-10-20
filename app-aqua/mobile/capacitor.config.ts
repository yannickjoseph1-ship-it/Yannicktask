import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Aqu.app mobile : la coque native charge le build du client web (../client/dist).
 * En développement, pointez `server.url` vers l'API/front distants (voir README).
 */
const config: CapacitorConfig = {
  appId: 'app.aqu.mobile',
  appName: 'Aqu.app',
  webDir: '../../client/dist',
  backgroundColor: '#000080',
  ios: { contentInset: 'automatic' },
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: { launchShowDuration: 800, backgroundColor: '#000080', showSpinner: false },
    StatusBar: { style: 'DARK', backgroundColor: '#000080' },
  },
};

export default config;
