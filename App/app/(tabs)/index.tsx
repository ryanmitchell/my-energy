import { Button, Image, StyleSheet, Platform, View } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import * as Crypto from 'expo-crypto';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import { MyEnergi } from '@/providers/MyEnergi';
import { SolarEdge } from '@/providers/SolarEdge';

export default function HomeScreen() {
  let baseUrl = 'https://energy-proxy.test';

  const [credentials, setCredentials] = useState([]);
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
        //console.log('This route is now unfocused.');
      }
    }, [])
  );

  let _addProvider = (type) => {
    let newCreds = [...credentials];

    newCreds.push({
      id: Crypto.randomUUID(),
      type: type,
      credentials: {},
    });

    _storeCredentials(newCreds);
  };

  let _storeCredentials = (newCreds) => {
    setCredentials(newCreds);
    console.log(newCreds);
    localStorage.setItem('credentials', JSON.stringify(newCreds));
  }

  let _updateCredentials = (id, creds) => {
    let newCreds = [...credentials].map((cred) => {
      if (cred.id == id) {
        cred.credentials = creds;
      }

      return cred;
    });

    _storeCredentials(newCreds);
  };

  let providers = [];
  credentials.forEach(cred => {
    if (cred.type == 'solarEdge') {
      providers.push(<SolarEdge key={cred.id} credentials={cred.credentials} baseUrl={baseUrl} providerId={cred.id} updateCredentials={_updateCredentials} />);
      return;
    }

    if (cred.type == 'myEnergi') {
      providers.push(<MyEnergi key={cred.id} credentials={cred.credentials} baseUrl={baseUrl} providerId={cred.id} updateCredentials={_updateCredentials} />);
      return;
    }
  });

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>

      { ! providers.length && <View>

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">My Energy</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText>Add a data provider to start monitoring your energy</ThemedText>
      </ThemedView>

      </View>}

      { providers }

      <Button onPress={() => _addProvider('solarEdge') } title="Add Solar Edge" />
      <Button onPress={() => _addProvider('myEnergi') } title="Add My Energi" />

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
