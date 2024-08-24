import { StyleSheet, View, type ViewProps } from 'react-native';
import { useContext, useCallback, useEffect, useState } from 'react';

const { DateTime } = require('luxon');

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

export function SolarEdge({ credentials, baseUrl, ...otherProps }) {

  let pollFrequency = 30 * 10000;

  const [anchorDate, setAnchorDate] = useState(DateTime.now());
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

  useEffect(() => {
    _solarEdgeV1(credentials);
  }, []);

  if (! solarEdge) {
    return (<View></View>);
  }

  return (
    <View>

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Solar Edge</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Power Now:</ThemedText>
        <ThemedText>{ ValueToHuman(solarEdge.overview.currentPower.power) }</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Power Today:</ThemedText>
        <ThemedText>{ ValueToHuman(solarEdge.overview.lastDayData.energy) }</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Power This Month:</ThemedText>
        <ThemedText>{ ValueToHuman(solarEdge.overview.lastMonthData.energy) }</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Power This Year:</ThemedText>
        <ThemedText>{ ValueToHuman(solarEdge.overview.lastYearData.energy) }</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Lifetime Power:</ThemedText>
        <ThemedText>{ ValueToHuman(solarEdge.overview.lifeTimeData.energy) }</ThemedText>
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

  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },

});
