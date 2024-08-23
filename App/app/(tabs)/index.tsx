import { Image, StyleSheet, Platform, View } from 'react-native';
import { useContext, useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';

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

const { DateTime } = require('luxon');
import * as Crypto from 'expo-crypto';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  let credentials;
  let baseUrl = 'https://energy-proxy.test';
  let pollFrequency = 30 * 10000;


  const [anchorDate, setAnchorDate] = useState(DateTime.now());
  const [hasProvider, setHasProvider] = useState(false);
  const [myEnergi, setMyEnergi] = useState(false);
  const [solarEdge, setSolarEdge] = useState(false);

  let _handleError = (err) => {
    console.error(err);
  }

  let _solarEdgeV1 = (credentials) => {
    if (! credentials.site) {
      return;
    }

    fetch(baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        service: 'solar-edge',
        site: credentials.site,
        key: credentials.key,
        endpoint: 'overview', query: ''
      }),
      headers: {
        'Content-Type': 'application/json',
      }
    })
      .then(response => response.json())
      .then(response => {

          fetch(baseUrl, {
            method: 'POST',
            body: JSON.stringify({
              service: 'solar-edge',
              site: credentials.site,
              key: credentials.key,
              endpoint: 'energy',
              query: 'timeUnit=DAY&endDate=' + anchorDate.endOf('month').toFormat('yyyy-MM-dd') + '&startDate=' + anchorDate.startOf('month').toFormat('yyyy-MM-dd')
            }),
            headers: {
              'Content-Type': 'application/json',
            }
          })
          .then(historyResponse => historyResponse.json())
          .then(historyResponse => {
            response.history = historyResponse.energy ?? [];

            setSolarEdge(response);

            // update every 30s
            setTimeout(() => _solarEdgeV1(credentials), pollFrequency);
          });
      })
      .catch(err => _handleError(err));
  };

  let _myEnergi = async (credentials) => {
    if (! credentials.device) {
      return;
    }

    fetch(baseUrl, {
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

        let totals = await fetch(baseUrl, {
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

        if (anchorDate.offset != 0) {
            let offsetDate = anchorDate.offset > 0 ? anchorDate.startOf('day').minus({ minutes: anchorDate.offset }) : anchorDate.startOf('day').plus({ minutes: anchorDate.offset });

            totals = await fetch(baseUrl, {
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

      })
      .catch(err => _handleError());
  }

  let _valueToHuman = (value) => {
    let sign = value > 0 ? '' : '-';

    value = Math.abs(value);

    if (value > 1000000) {
      return sign + (value / 1000000).toFixed(1) + 'MWh';
    }

    if (value > 1000) {
      return sign + (value / 1000).toFixed(1) + 'kWh';
    }

    return sign + (value / 1).toFixed(1) + 'Wh';
  }

  useFocusEffect(
    useCallback(() => {
      credentials = JSON.parse(localStorage.getItem('credentials') ?? '[]');

      if ( ! credentials) {
        setHasProvider(false);
        return;
      }

      setHasProvider(true);

      if (credentials.solarEdge) {
        _solarEdgeV1(credentials.solarEdge);
      }

      if (credentials.myEnergi) {
        _myEnergi(credentials.myEnergi);
      }

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

      { solarEdge && <View>

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Solar Edge</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Power Now:</ThemedText>
        <ThemedText>{ _valueToHuman(solarEdge.overview.currentPower.power) }</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Power Today:</ThemedText>
        <ThemedText>{ _valueToHuman(solarEdge.overview.lastDayData.energy) }</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Power This Month:</ThemedText>
        <ThemedText>{ _valueToHuman(solarEdge.overview.lastMonthData.energy) }</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Power This Year:</ThemedText>
        <ThemedText>{ _valueToHuman(solarEdge.overview.lastYearData.energy) }</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Lifetime Power:</ThemedText>
        <ThemedText>{ _valueToHuman(solarEdge.overview.lifeTimeData.energy) }</ThemedText>
      </ThemedView>

      <Bar
        data={{
          labels: solarEdge.history.values.map(value => DateTime.fromFormat(value.date, 'yyyy-MM-dd hh:mm:ss').toLocaleString({ day: 'numeric' })),
          datasets: [
            {
              label: anchorDate.toLocaleString({ month: 'long', year: 'numeric' }),
              data: solarEdge.history.values.map(value => (value.value ?? 0) / 1000),
              backgroundColor: 'rgb(0, 0, 255)',
            },
          ],
        }}
        options={{
          scales: {
            x: {
              title: {
                text: 'Date',
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
      />

      </View>}

      { myEnergi && <View>

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Andi's MyEnergi</ThemedText>
      </ThemedView>

      { myEnergi.harvi && myEnergi.harvi[0] &&<ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Current Import/Export:</ThemedText>
        <ThemedText>{ _valueToHuman(myEnergi.harvi[0].ectp1) }</ThemedText>
      </ThemedView>
      }

      { myEnergi.eddi && myEnergi.eddi[0] &&<ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Current Diverted to tank:</ThemedText>
        <ThemedText>{ _valueToHuman(myEnergi.eddi[0].div * 1000) }</ThemedText>
      </ThemedView>
      }

      { myEnergi.eddi && myEnergi.eddi[0] &&<ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Total to tank:</ThemedText>
        <ThemedText>{ _valueToHuman(myEnergi.eddi[0].che * 1000) }</ThemedText>
      </ThemedView>
      }

      { myEnergi.eddi && myEnergi.totals && <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Total import:</ThemedText>
        <ThemedText>{ _valueToHuman(myEnergi.totals.reduce((accumulator, val) => {
            return accumulator + (val.imp ?? 0);
        }, 0) / 3600) }</ThemedText>
      </ThemedView>
      }

      { myEnergi.totals && <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Total export:</ThemedText>
        <ThemedText>{ _valueToHuman(myEnergi.totals.reduce((accumulator, val) => {
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
              backgroundColor: 'rgb(0, 255, 0)',
            },
            {
              label: 'Export',
              data: myEnergi.totals.map(value => (value.exp ?? 0) / 3600 / 1000),
              backgroundColor: 'rgb(255, 0, 0)',
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

      </View> }

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
