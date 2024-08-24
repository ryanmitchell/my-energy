import { Image, StyleSheet, Platform, View } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import { MyEnergi } from '@/providers/MyEnergi';
import { SolarEdge } from '@/providers/SolarEdge';

export default function HomeScreen() {
  let baseUrl = 'https://energy-proxy.test';

  const [credentials, setCredentials] = useState({});
  const [hasProvider, setHasProvider] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let creds = JSON.parse(localStorage.getItem('credentials') ?? '[]');

      if ( ! creds) {
        setHasProvider(false);
        setCredentials({});
        return;
      }

      setHasProvider(true);
      setCredentials(creds);

      return () => {
        console.log('This route is now unfocused.');
      }
    }, [])
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>

      { ! hasProvider && <View>

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">My Energy</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Add a data provider</ThemedText>
        <ThemedText>Add a data provider to start monitoring your energy</ThemedText>
      </ThemedView>

      </View>}

      { credentials.solarEdge && <SolarEdge credentials={credentials.solarEdge} baseUrl={baseUrl} />}

      { credentials.myEnergi && <MyEnergi credentials={credentials.myEnergi} baseUrl={baseUrl} />}

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },

  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },

  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },

});
