'use client';
import { useRef, useEffect, useState } from 'react';
import Chart from 'chart.js/auto';
import { percent, REPORT_DATE_REG } from '../util';
// import { Segmented } from 'antd';

Chart.defaults.font.family = 'serif';

export default function ({ data, field, title }) {
  const container = useRef();
  const chart = useRef();
  const [reportType, setReportType] = useState('acc');
  function setChartData() {
    const labels = Object.keys(data).filter(key => REPORT_DATE_REG.test(key)).sort(
      (a, b) => new Date(...a.split('-')) - new Date(...b.split('-'))
    );
    const _field = reportType === 'acc' ? field : `${field}_Q`;
    chart.current.data = {
      labels,
      datasets: [
        {
          type: 'line',
          label: '同比',
          data: labels.map(label => data[label][`${_field}_YOY`]),
          yAxisID: 'y2',
        },
        {
          label: title,
          data: labels.map(label => data[label][_field]),
          yAxisID: 'y1',
        },
        // {
        //   type: 'line',
        //   label: '环比',
        //   data: labels.map(label => data[label][`${field}_QOQ`]),
        //   yAxisID: 'y2',
        // },
      ],
    };
    chart.current.update();
  }
  useEffect(() => {
    if (chart.current) return;
    chart.current = new Chart(container.current, {
      type: 'bar',
      data: {},
      options: {
        responsive: false,
        scales: {
          y1: {
            ticks: {
              // callback: ticker,
            },
            grid: {
              // display: false,
            },
          },
          y2: {
            position: 'right',
            ticks: {
              callback: v => percent(v),
            },
            grid: {
              display: false,
            },
          },
        },
        // scales: {
        //   y: {
        //     beginAtZero: true,
        //   },
        // },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        // plugins: {
        //   title: {
        //     display: true,
        //   }
        // }
      },
    });
  }, []);

  useEffect(setChartData, [reportType]);

  return (
    <>
      {/* <Segmented
        options={[
          { label: '累积季报', value: 'acc' },
          {
            label: '季报',
            value: 'quarter',
          },
        ]}
        value={reportType}
        onChange={setReportType}
      ></Segmented> */}
      <canvas
        ref={container}
        style={{
          height: '70vh',
          width: '100%',
        }}
      ></canvas>
    </>
  );
}
