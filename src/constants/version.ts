import packageJson from '../../package.json';
import appJson from '../../app.json';

export const APP_VERSION = packageJson.version;
export const APP_NAME = appJson.displayName || appJson.name;
// Build numbers are managed in native projects (android/app/build.gradle and ios/TruPhotos/Info.plist)
export const BUILD_NUMBER_IOS = '1';
export const BUILD_NUMBER_ANDROID = '1';

export const getVersionString = (platform: 'ios' | 'android' | 'web' = 'android'): string => {
  if (platform === 'ios') {
    return `${APP_VERSION} (${BUILD_NUMBER_IOS})`;
  } else if (platform === 'android') {
    return `${APP_VERSION} (${BUILD_NUMBER_ANDROID})`;
  }
  return APP_VERSION;
};

export const getFullVersionInfo = () => ({
  version: APP_VERSION,
  buildNumberIOS: BUILD_NUMBER_IOS,
  buildNumberAndroid: BUILD_NUMBER_ANDROID,
  appName: APP_NAME,
});

