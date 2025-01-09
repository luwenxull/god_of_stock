// import balance_key from '../data/balance/key.js';
import ENTS_SHENWAN from "../data/ents.shenwan.json";

const ents = ENTS_SHENWAN.filter((e) => !/^(20|900)/.test(e.SECCODE));

export const ENT_DIC = {}; // 公司
export const IND_DIC = {}; // 行业

/** 填充数据 */
for (const ent of ents) {
  ENT_DIC[ent.SECCODE] = ent;
  if (!IND_DIC[ent.F011V]) {
    IND_DIC[ent.F011V] = [];
  }
  IND_DIC[ent.F011V].push(ent);
}

export const ENT_OPTIONS = ents.map((item) => {
  return {
    label: item.SECCODE + " - " + item.SECNAME,
    value: item.SECCODE,
  };
});

export const REPORT_DATE_REG = /^\d{4}-\d{2}-\d{2}$/;

export const REPORT_TYPES = [
  {
    label: "年报",
    value: "annual",
  },
  {
    label: "累积季报",
    value: "quarter_cumulative",
  },
  // {
  //   label: '单季报',
  //   value: 'quarter',
  // },
];

export function splitArrayIntoChunks(array, chunkSize) {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    result.push(chunk);
  }
  return result;
}

export function formatDate(y, m, d) {
  return `${y}-${m < 10 ? "0" + m : m}-${d < 10 ? "0" + d : d}`;
}

export function getDates(count, start) {
  let year, month;
  if (start === undefined) {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
  } else {
    [year, month] = start.split("-").map((v) => parseInt(v));
  }
  let startMonth = Math.floor((month - 1) / 3) * 3,
    startYear = year;
  if (startMonth === 0) {
    startMonth = 12;
    startYear = year - 1;
  }
  return new Array(count)
    .fill(0)
    .reduce((arr, _, i) => {
      if (i === 0) {
        arr.push([startYear, startMonth, startMonth === 12 || startMonth === 3 ? 31 : 30]);
      } else {
        const [y, m] = arr[i - 1];
        if (m === 3) {
          arr.push([y - 1, 12, 31]);
        } else {
          arr.push([y, m - 3, m - 3 === 12 || m - 3 === 3 ? 31 : 30]);
        }
      }
      return arr;
    }, [])
    .map(([y, m, d]) => formatDate(y, m, d));
}

export function getEntsOfSameInd(ent) {
  return IND_DIC[ENT_DIC[ent].F011V].map((s) => s.SECCODE);
}

export function fetchEntReport(ent, compare) {
  const code = compare ? IND_DIC[ENT_DIC[ent].F011V].map((s) => s.SECCODE).toString() : ent;
  return fetch(`/api/ent/report?code=${code}`).then((res) => res.json());
}

export function getLastFiveYear() {
  const now = new Date();
  const year = now.getFullYear();
  return new Array(5).fill(0).map((_, i) => year - i);
}

/** 生成报告日期 */
export function getReportDates(type) {
  if (type === "annual") {
    return getLastFiveYear()
      .slice(1)
      .map((year) => ({ value: `${year}-12-31`, label: `${year}年` }));
  } else {
    return Object.entries(
      getDates(20).reduce((map, str) => {
        const [y, m] = str.split("-");
        if (!map[y]) {
          map[y] = [];
        }
        map[y].push({
          value: str,
          label: `第${Math.floor((m - 1) / 3) + 1}季度`,
        });
        return map;
      }, {})
    )
      .sort((a, b) => b[0] - a[0])
      .map(([y, options]) => ({
        label: `${y}年`,
        options,
      }));
  }
}

export function formatNumber(num) {
  if (num >= 1e8 || num <= -1e8) {
    return (num / 1e8).toFixed(2) + "亿";
  } else if (num >= 1e4 || num <= -1e4) {
    return (num / 1e4).toFixed(2) + "万";
  } else {
    return num.toFixed(2);
  }
}

export function groupsColumns(groups, columns) {
  const keyed = columns.reduce((acc, c) => {
    acc[c.dataIndex] = c;
    return acc;
  }, {});
  const childrened = {};
  for (const column of columns) {
    if (groups[column.dataIndex]) {
      delete column.sorter;
      column.children = groups[column.dataIndex].children.map((key) => keyed[key]);
      for (const key of groups[column.dataIndex].children) {
        childrened[key] = true;
      }
    }
  }
  return columns.filter((c) => !childrened[c.dataIndex]);
}

export function calculateCAGR(beginningValue, endingValue, years) {
  const r = (endingValue - beginningValue) / Math.abs(beginningValue);
  return ((Math.abs(r) + 1) ** (1 / years) - 1) * (r > 0 ? 1 : -1);
}

export function getRelativeDate(date, dy = 0, dm = 0, dd = 0) {
  const [y, m, d] = date.split("-").map(Number);
  return formatDate(y + dy, m + dm, d + dd);
}

export function percent(value, dc = 2) {
  return typeof value === "number" ? (value * 100).toFixed(dc) + "%" : null;
}

export function getPrevQuarter(date) {
  let prevDate = getRelativeDate(date, 0, -3);
  let [y, m, d] = prevDate.split("-").map(Number);
  if (m === 0) {
    y -= 1;
    m = 12;
  }
  if (m === 3 || m === 12) {
    d = 31;
  } else {
    d = 30;
  }
  return formatDate(y, m, d);
}

export function getFirstQuarter(date) {
  const [y] = date.split("-").map(Number);
  return formatDate(y, 3, 31);
}

/**
 * 计算同比
 * @param {*} data
 * @param {*} key
 * @param {*} date
 */
export function addYOY(data, test = () => true) {
  Object.keys(data)
    .filter((key) => REPORT_DATE_REG.test(key))
    .forEach((date) => {
      const prev = data[getRelativeDate(date, -1)];
      if (prev) {
        const curr = data[date];
        Object.keys(curr)
          .filter(test)
          .forEach((key) => {
            const prevValue = prev[key],
              curValue = curr[key];
            if (typeof prevValue === "number" && typeof curValue === "number") {
              curr[key + "_YOY"] = calculateCAGR(prevValue, curValue, 1);
            }
          });
      }
    });
  // Object.keys(data).forEach(date => {
  //   const prev = data[getPrevQuarter(date)];
  //   if (prev) {
  //     const curr = data[date];
  //     Object.keys(curr)
  //       .filter(k => /_Q$/.test(k))
  //       .forEach(key => {
  //         const prevValue = prev[key],
  //           curValue = curr[key];
  //         if (typeof prevValue === 'number' && typeof curValue === 'number') {
  //           curr[key + '_QOQ'] = calculateCAGR(prevValue, curValue, 1);
  //         }
  //       });
  //   }
  // });
  return data;
}

export function findDeepest(datas) {
  const result = [];
  for (const data of datas) {
    if (data.children && data.children.length) {
      result.push(...findDeepest(data.children));
    } else {
      result.push(data);
    }
  }
  return result;
}

export function buildIndex(values) {
  return values.reduce((acc, curr, i) => {
    if (acc[curr] === undefined) {
      // 排除重复值
      acc[curr] = i;
    }
    return acc;
  }, {});
}

export function get(data, keys, dft) {
  let result = data;
  for (const key of keys) {
    if (result === undefined) {
      return dft;
    }
    if (typeof key === "function") {
      result = key(result);
    } else {
      result = result[key];
    }
  }
  return result === undefined ? dft : result;
}

export function getMarket(code) {
  if (/^(30|00)/.test(code)) {
    return "SZ";
  } else if (/^(60|68)/.test(code)) {
    return "SH";
  }
  return "BJ";
}
