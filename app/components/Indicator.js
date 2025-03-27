"use client";
import { useRef, useEffect, useState } from "react";
import Chart from "chart.js/auto";
import { Switch } from "@nextui-org/react";
import { formatNumber, percent, REPORT_DATE_REG } from "../util";

Chart.defaults.font.family = "serif";

const ENABLE_Q_MODE = ["OPERATE_INCOME", "CORE_PROFIT"];

export default function ({ data, field, title, percent: __percent }) {
  const container = useRef();
  const chart = useRef();
  const [qMode, setQMode] = useState(false);
  function setChartData() {
    const labels = Object.keys(data)
      .filter((key) => REPORT_DATE_REG.test(key))
      .sort((a, b) => new Date(...a.split("-")) - new Date(...b.split("-")))
      .slice(0, -1);
    const _field = qMode ? `${field}_Q` : field;
    chart.current.data = {
      labels,
      datasets: [
        {
          label: title,
          data: labels.map((label) => data[label][_field]),
          yAxisID: "y1",
        },
        {
          type: "line",
          label: "同比",
          data: labels.map((label) => data[label][`${_field}_YOY`]),
          yAxisID: "y2",
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
      type: "bar",
      data: {},
      options: {
        responsive: false,
        scales: {
          y1: {
            ticks: {
              callback: (v) => (__percent ? percent(v) : formatNumber(v)),
            },
            grid: {
              display: false,
            },
          },
          y2: {
            position: "right",
            ticks: {
              callback: (v) => percent(v),
            },
            grid: {
              // display: false,
            },
          },
        },
        // scales: {
        //   y: {
        //     beginAtZero: true,
        //   },
        // },
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          tooltip: {
            callbacks: {
              label(context) {
                const label = `${context.dataset.label}: `;
                if (context.dataset.yAxisID === "y1" && !__percent) {
                  return label + formatNumber(context.parsed.y);
                } else {
                  return label + percent(context.parsed.y);
                }
              },
            },
          },
        },
      },
    });
  }, []);

  useEffect(setChartData, [qMode]);

  return (
    <>
      {ENABLE_Q_MODE.includes(field) && (
        <Switch isSelected={qMode} onValueChange={setQMode}>
          单季报
        </Switch>
      )}
      <canvas
        ref={container}
        style={{
          height: "70vh",
          width: "100%",
        }}
      ></canvas>
    </>
  );
}
