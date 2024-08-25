import { Button, StyleSheet, TextInput, View, type ViewProps } from 'react-native';
import { useContext, useCallback, useEffect, useState } from 'react';

const { DateTime } = require('luxon');
import { Formik, ErrorMessage } from 'formik';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

import { useThemeColor } from '@/hooks/useThemeColor';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import { ValueToHuman } from '@/constants/ValueToHuman';

import { AppContext } from '@/constants/AppContext';

export function MyEnergi({ credentials, providerId, ...otherProps }) {

  const context = useContext(AppContext);

  let pollFrequency = 30 * 10000;
  let timeoutId;

  const [anchorDate, setAnchorDate] = useState(DateTime.now());
  const [myEnergi, setMyEnergi] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  let _handleError = (err) => {
    console.error(err);
  }

  let _myEnergi = async (credentials) => {
    if (! credentials.device) {
      return;
    }

    fetch(context.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        service: 'my-energi',
        device: credentials.device,
        password: credentials.password,
      }),
      headers: {
        'Content-Type': 'application/json',
      }
    })
      .then(response => response.json())
      .then(async (response) => {
        let r = {};
        response.forEach(v => {
          if (v.eddi) {
            r.eddi = v.eddi;
          }

          if (v.harvi) {
            r.harvi = v.harvi;
          }
        });

        let totals = await fetch(context.baseUrl, {
          method: 'POST',
          body: JSON.stringify({
            service: 'my-energi',
            device: credentials.device,
            password: credentials.password,
            endpoint: '/cgi-jdayhour-E' + credentials.device + '-' + anchorDate.toFormat('yyyy-MM-dd'),
          }),
          headers: {
            'Content-Type': 'application/json',
          }
        });

        totals = await totals.json();

        for (let u in totals) {
            r.totals = totals[u];
        }

        // if we are in a timezone offset but the myenergi api uses UTC,
        // so we need to check yesterday or forwards to tomorrow the right
        // number of hours to compensate
        if (anchorDate.offset != 0) {
            let offsetDate = anchorDate.offset > 0 ? anchorDate.startOf('day').minus({ minutes: anchorDate.offset }) : anchorDate.startOf('day').plus({ minutes: anchorDate.offset });

            totals = await fetch(context.baseUrl, {
              method: 'POST',
              body: JSON.stringify({
                service: 'my-energi',
                device: credentials.device,
                password: credentials.password,
                endpoint: '/cgi-jdayhour-E' + credentials.device + '-' + offsetDate.toFormat('yyyy-MM-dd'),
              }),
              headers: {
                'Content-Type': 'application/json',
              }
            });

            totals = await totals.json();

            for (let u in totals) {
                totals[u].forEach((total) => {
                    if (anchorDate.offset > 0) {
                        if (total.hr >= (24 - (anchorDate.offset / 60))) {
                            r.totals = [total].concat(r.totals);
                        }
                    } else {
                        if (total.hr < (24 - (anchorDate.offset / 60))) {
                            r.totals.push(total);
                        }
                    }
                });
            }
        }

        setMyEnergi(r);

        // update every 30s
        timeoutId = setTimeout(() => _myEnergi(credentials), pollFrequency);

      })
      .catch(err => _handleError());
  }

  useEffect(() => {
    if (credentials.device) {
        _myEnergi(credentials);
        setShowSettings(false);
    }

    return function cleanup() {
      try {
        clearTimeout(timoutId)
      } catch (e) {

      }
    };
  }, []);

  if (showSettings) {

    return (<View>
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
        credentials = values;
        context.updateCredentials(providerId, values);
        showSettings(false);
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

          <View>
            <Button onPress={handleSubmit} title="Submit" />
          </View>

          <View style={{ marginTop: 8 }}>
            <Button onPress={() => setShowSettings(false) } title="Cancel" />
          </View>

        </ThemedView>
      )}
      </Formik>

    </View>);
  }

  if (! myEnergi) {
    return (<View></View>);
  }

  return (
<View>

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">MyEnergi</ThemedText>
      </ThemedView>

      { myEnergi.harvi && myEnergi.harvi[0] &&<ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Current Import/Export:</ThemedText>
        <ThemedText>{ ValueToHuman(myEnergi.harvi[0].ectp1) }</ThemedText>
      </ThemedView>
      }

      { myEnergi.eddi && myEnergi.eddi[0] &&<ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Current Diverted to tank:</ThemedText>
        <ThemedText>{ ValueToHuman(myEnergi.eddi[0].div * 1000) }</ThemedText>
      </ThemedView>
      }

      { myEnergi.eddi && myEnergi.eddi[0] &&<ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Total to tank:</ThemedText>
        <ThemedText>{ ValueToHuman(myEnergi.eddi[0].che * 1000) }</ThemedText>
      </ThemedView>
      }

      { myEnergi.eddi && myEnergi.totals && <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Total import:</ThemedText>
        <ThemedText>{ ValueToHuman(myEnergi.totals.reduce((accumulator, val) => {
            return accumulator + (val.imp ?? 0);
        }, 0) / 3600) }</ThemedText>
      </ThemedView>
      }

      { myEnergi.totals && <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Total export:</ThemedText>
        <ThemedText>{ ValueToHuman(myEnergi.totals.reduce((accumulator, val) => {
            return accumulator + (val.exp ?? 0);
        }, 0) / 3600) }</ThemedText>
      </ThemedView>
      }

      { myEnergi.totals && <Bar
        data={{
          labels: myEnergi.totals.map(value => (value.hr ?? 0) + (anchorDate.offset / 60)),
          datasets: [
            {
              label: 'Import',
              data: myEnergi.totals.map(value => (value.imp ?? 0) / 3600 / 1000),
              backgroundColor: 'rgb(0, 0, 0)',
            },
            {
              label: 'Export',
              data: myEnergi.totals.map(value => (value.exp ?? 0) / 3600 / 1000),
              backgroundColor: 'rgb(0, 255, 0)',
            },
          ],
        }}
        options={{
          scales: {
            x: {
              title: {
                text: 'Hour',
                display: true,
              }
            },
            y: {
              title: {
                text: 'kWh',
                display: true,
              }
            },
          },
        }}
      />}

      </View>
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

  input: {
    padding: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#eee',
  }

});
