import * as React from 'react';
import { Image, View, StyleSheet, Platform } from 'react-native';
import { SvgUri } from 'react-native-svg';

interface LogoProps {
  width?: number;
  height?: number;
  isOpen?: boolean;
}

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_e0e2384a-408a-404f-bd58-1622309480b4/artifacts/21fue0x2_tuningfux-gelb.svg';

export const Logo: React.FC<LogoProps> = ({ width = 170, height = 52, isOpen = false }) => {
  // For web, use an img tag via Image component
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { width, height }]}>
        <Image
          source={{ uri: LOGO_URL }}
          style={{ width, height }}
          resizeMode="contain"
        />
      </View>
    );
  }
  
  // For native platforms, use SvgUri
  return (
    <View style={[styles.container, { width, height }]}>
      <SvgUri
        width={width}
        height={height}
        uri={LOGO_URL}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Logo;
