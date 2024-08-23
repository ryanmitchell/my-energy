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
        <ThemedText type="title">Providers</ThemedText>
      </ThemedView>

      <ThemedText type="subtitle">Solar Edge:</ThemedText>

      <Formik
       initialValues={{
         key: credentials?.solarEdge?.key ?? '',
         site: credentials?.solarEdge?.site ?? '',
       }}
      validate={values => {
          const errors = {};

          if (! values.key) {
              errors.key = 'Required';
          }

          if (! values.site) {
              errors.site = 'Required';
          }

          return errors;
      }}
      onSubmit={values => {
        _updateCredentials('solarEdge', values);
      }}
      >
      {({ handleChange, handleBlur, handleSubmit, values }) => (
        <ThemedView>

          <ThemedText>API Key</ThemedText>
          <TextInput
            onChangeText={handleChange('key')}
            onBlur={handleBlur('key')}
            value={values.key}
            style={styles.input}
          />
          <ErrorMessage name="key" render={msg => <ThemedText type="error">{msg}</ThemedText>}/>

          <ThemedText>Site ID</ThemedText>
          <TextInput
            onChangeText={handleChange('site')}
            onBlur={handleBlur('site')}
            value={values.site}
            style={styles.input}
          />
          <ErrorMessage name="site" render={msg => <ThemedText type="error">{msg}</ThemedText>}/>

          <Button onPress={handleSubmit} title="Submit" />
        </ThemedView>
      )}
      </Formik>



      <ThemedText type="subtitle">My Energi:</ThemedText>

      <Formik
       initialValues={{
         device: credentials?.myEnergi?.device ?? '',
         password: credentials?.myEnergi?.password ?? '',
       }}
      validate={values => {
          const errors = {};

          if (! values.device) {
              errors.device = 'Required';
          }

          if (! values.password) {
              errors.password = 'Required';
          }

          return errors;
      }}
      onSubmit={values => {
        _updateCredentials('myEnergi', values);
      }}
      >
      {({ handleChange, handleBlur, handleSubmit, values }) => (
        <ThemedView>

          <ThemedText>Device ID</ThemedText>
          <TextInput
            onChangeText={handleChange('device')}
            onBlur={handleBlur('device')}
            value={values.device}
            style={styles.input}
          />
          <ErrorMessage name="device" render={msg => <ThemedText type="error">{msg}</ThemedText>}/>

          <ThemedText>Password</ThemedText>
          <TextInput
            onChangeText={handleChange('password')}
            onBlur={handleBlur('password')}
            value={values.password}
            style={styles.input}
          />
          <ErrorMessage name="password" render={msg => <ThemedText type="error">{msg}</ThemedText>}/>

          <Button onPress={handleSubmit} title="Submit" />
        </ThemedView>
      )}
      </Formik>


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
