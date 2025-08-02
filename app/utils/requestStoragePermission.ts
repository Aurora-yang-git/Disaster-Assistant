import { Platform, PermissionsAndroid } from 'react-native';

export async function requestStoragePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission Required',
        message: 'Mazu needs access to storage to load the AI model for offline use.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Storage permission granted');
      return true;
    } else {
      console.log('Storage permission denied');
      return false;
    }
  } catch (err) {
    console.warn(err);
    return false;
  }
}