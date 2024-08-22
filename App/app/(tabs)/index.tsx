import { Image, StyleSheet, Platform, View } from 'react-native';
import { useContext, useEffect, useState } from 'react';

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

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {

  let credentials = JSON.parse(localStorage.getItem('credentials') ?? '[]');
  let pollFrequency = 30 * 10000;

  const [anchorDate, setAnchorDate] = useState(DateTime.now());
  const [solarEdge, setSolarEdge] = useState(false);

  let _handleError = (err) => {
    console.error(err);
  }

  let _proxy = (url) => {
    return 'https://corsproxy.io/?' + encodeURIComponent(url + '&uid=' + DateTime.now().toMillis());
  };

  let _solarEdgeV1 = (credentials) => {
    console.log(credentials);
    if (! credentials.site) {
      return;
    }

    fetch(_proxy('https://monitoringapi.solaredge.com/site/' + credentials.site + '/overview?api_key=' + credentials.key + '&format=json'))
      .then(response => response.json())
      .then(response => {

        fetch(_proxy('https://monitoringapi.solaredge.com/site/' + credentials.site + '/energy?api_key=' + credentials.key + '&timeUnit=DAY&endDate=' + anchorDate.endOf('month').toFormat('yyyy-MM-dd') + '&startDate=' + anchorDate.startOf('month').toFormat('yyyy-MM-dd') + '&format=json'))
          .then(historyResponse => historyResponse.json())
          .then(historyResponse => {
            response.history = historyResponse.energy;

            setSolarEdge(response);

            // update every 30s
            setTimeout(() => _solarEdgeV1(credentials), pollFrequency);
          });
      })
      .catch(err => _handleError(err));
  };

  let _valueToHuman = (value) => {
    if (value > 1000000) {
      return (value / 1000000).toFixed(1) + 'MWh';
    }

    if (value > 1000) {
      return (value / 1000).toFixed(1) + 'kWh';
    }

    return (value / 1).toFixed(1) + 'Wh';
  }

  useEffect(() => {
    if ( ! credentials) {
      return;
    }

    if (credentials.solarEdge) {
      _solarEdgeV1(credentials.solarEdge);
    }
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>

      { ! credentials && <View>

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
            },
          ],
        }}
        options={{
          indexAxis: 'y',
          scales: {
            x: {
              title: {
                text: 'kWh',
                display: true,
              }
            },
            y: {
              title: {
                text: 'Date',
                display: true,
              }
            },
          },
        }}
      />

      </View>}

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
