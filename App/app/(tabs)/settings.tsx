import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, TextInput, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';

import { useFocusEffect } from '@react-navigation/native';

import { Formik, ErrorMessage } from 'formik';
import { Collapsible } from '@/components/Collapsible';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function TabTwoScreen() {

  const [credentials, setCredentials] = useState(false);

  useEffect(() => {
    setCredentials(JSON.parse(localStorage.getItem('credentials') ?? '[]'));
  }, []);

  let _updateCredentials = (key, value) => {
    let creds = {...credentials};
    creds[key] = value;

    localStorage.setItem('credentials', JSON.stringify(creds));

    setCredentials(creds);
  }

  if (credentials === false) {
    return (<ThemedView></ThemedView>);
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={<Ionicons size={310} name="code-slash" style={styles.headerImage} />}>

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Settings</ThemedText>
      </ThemedView>

      <ThemedText>This may be redundant now</ThemedText>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    padding: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#eee',
  }
});
