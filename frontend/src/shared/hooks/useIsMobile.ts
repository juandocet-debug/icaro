import { useWindowDimensions } from 'react-native';

export const useIsMobile = (): boolean => {
  const { width } = useWindowDimensions();
  return width < 768;
};
