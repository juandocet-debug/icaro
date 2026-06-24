import { Platform, Dimensions } from 'react-native';

export const isWeb = Platform.OS === 'web';

export const isLargeScreen = () => {
  if (!isWeb) return false;
  return Dimensions.get('window').width >= 1024;
};
