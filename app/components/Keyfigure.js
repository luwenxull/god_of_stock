"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import {
  addYOY,
  buildIndex,
  ENT_DIC,
  formatNumber,
  get,
  getDates,
  getMarket,
  percent,
  REPORT_DATE_REG,
} from "../util.js";
import Indicator from "./Indicator.js";
import Table from "./Table.js";

export default function Keyfigure(props) {
  const rawColumns = [
    {
      title: "公司",
      fixed: "left",
      children: [
        {
          title: "代码",
          dataIndex: "CODE",
          __stat: false,
          __render: (_, data) => {
            const market = getMarket(data.CODE);
            return (
              <Popover placement="right">
                <PopoverTrigger>
                  <Button color="primary" size="sm" variant="bordered">
                    {data.CODE}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="p-2 flex gap-2">
                    <Link
                      href={`https://basic.10jqka.com.cn/astockph/briefinfo/index.html?showhead=0&code=${
                        data.CODE
                      }&marketid=${market === "SH" ? "17" : "33"}`}
                      target="_blank"
                      size="sm"
                    >
                      同花顺
                    </Link>
                    <Link
                      href={`https://emweb.securities.eastmoney.com/pc_hsf10/pages/index.html?type=web&code=${
                        market + data.CODE
                      }&color=b#/cwfx`}
                      target="_blank"
                      size="sm"
                    >
                      东方财富
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>
            );
          },
          fixed: "left",
        },
        {
          title: "名称",
          dataIndex: "SECURITY_NAME_ABBR",
          __stat: false,
          __render: (_, data) => {
            return ENT_DIC[data.CODE]?.SECNAME;
          },
          fixed: "left",
        },
        {
          title: "得分",
          dataIndex: "SCORE",
          fixed: "left",
        },
      ],
    },
    {
      title: "成长能力",
      children: [
        {
          title: "营业收入",
          dataIndex: "OPERATE_INCOME",
          __score: 1,
        },
        {
          title: "同比",
          dataIndex: "OPERATE_INCOME_YOY",
          __score: 0.5,
          __percent: true,
        },
        {
          title: "三年复合增速",
          dataIndex: "OPERATE_INCOME_CARG",
          __percent: true,
          __score: 1,
        },
        {
          title: "与成本差",
          dataIndex: "OPERATE_INCOME_CARG_DIFF_COST",
          __percent: true,
          __score: 0.5,
        },
        {
          title: "营业成本",
          dataIndex: "OPERATE_COST",
          __score: 0,
        },
        // {
        //   title: '三年复合增速',
        //   dataIndex: 'OPERATE_COST_CARG',
        //   __percent: true,
        // },
        // {
        //   title: '毛利润',
        //   dataIndex: 'GROSS_PROFIT',
        //   __score: 0.5,
        // },
        // {
        //   title: '同比',
        //   dataIndex: 'GROSS_PROFIT_YOY',
        //   __score: 0.5,
        //   __percent: true,
        // },
        {
          title: "核心利润",
          dataIndex: "CORE_PROFIT",
          __score: 0.5,
        },
        {
          title: "同比",
          dataIndex: "CORE_PROFIT_YOY",
          __score: 0.5,
          __percent: true,
        },
        {
          title: "净利润",
          dataIndex: "NETPROFIT",
          __score: 0.5,
        },
        {
          title: "同比",
          dataIndex: "NETPROFIT_YOY",
          __score: 0.5,
          __percent: true,
        },
        {
          title: "三年复合增速",
          dataIndex: "NETPROFIT_CARG",
          __percent: true,
          __score: 1,
        },
      ],
    },
    {
      title: "盈利能力",
      children: [
        {
          title: "净资产收益率",
          dataIndex: "ROE",
          __percent: true,
          __score: 2,
        },
        {
          title: "总资产收益率",
          dataIndex: "ROA",
          __percent: true,
        },
        {
          title: "毛利率",
          dataIndex: "GPM",
          __percent: true,
        },
        {
          title: "核心利润率",
          dataIndex: "CPM",
          __percent: true,
        },
        {
          title: "转化率",
          dataIndex: "CPM_GPM",
          __percent: true,
          __score: 0.5,
        },
        {
          title: "净利率",
          dataIndex: "NPM",
          __percent: true,
        },
      ],
    },
    {
      title: "现金状况",
      children: [
        {
          title: "收现比",
          dataIndex: "CASH_INCOME",
          __percent: true,
          __score: 0.5,
        },
        {
          title: "销售现金净额",
          dataIndex: "SALES_SERVICES",
          __score: 0.5,
        },
        {
          title: "现金报酬率",
          dataIndex: "CASH_RECOVERY",
          __percent: true,
          __score: 1.5,
        },
      ],
    },
    {
      title: "资产质量",
      children: [
        // {
        //   title: '总资产',
        //   dataIndex: 'TOTAL_ASSETS',
        // },
        {
          title: "资产负债率",
          dataIndex: "LIAB_ASSETS",
          __percent: true,
          __reverse: true,
          __score: 1,
        },
        {
          title: "有息负债率",
          dataIndex: "INTEREST_DEBT_RATIO",
          __percent: true,
          __reverse: true,
          __score: 1.5,
        },
        {
          title: "存货占比",
          dataIndex: "INVENTORY_ASSETS",
          __percent: true,
          __reverse: true,
          __score: 0.5,
        },
        // {
        //   title: '三年复合增速',
        //   dataIndex: 'INVENTORY_CARG',
        //   __percent: true,
        // },
        {
          title: "应收账款占比",
          dataIndex: "NOTE_ACCOUNTS_RECE_ASSETS",
          __percent: true,
          __reverse: true,
        },
        {
          title: "长期待摊费用占比",
          dataIndex: "LPE",
          __percent: true,
          __reverse: true,
        },
        // {
        //   title: '三年复合增速',
        //   dataIndex: 'NOTE_ACCOUNTS_RECE_CARG',
        //   __percent: true,
        // },
        {
          title: "折旧率",
          dataIndex: "DEPRECIATION",
          __percent: true,
          __score: 0.5,
        },
        {
          title: "坏账率",
          dataIndex: "BAD_DEBT",
          __percent: true,
          __score: 0.5,
        },
        {
          title: "重资产收益率",
          dataIndex: "NETPROFIT_HEAVY_ASSETS",
          __percent: true,
          __score: 0.5,
        },
      ],
    },
    {
      title: "营运能力",
      children: [
        {
          title: "应收账款周转率",
          dataIndex: "RECEIVABLE_TURNOVER",
          __score: 0.5,
        },
        {
          title: "存货周转率",
          dataIndex: "INVENTORY_TURNOVER",
          __score: 0.5,
        },
        {
          title: "总资产周转率",
          dataIndex: "ASSET_TURNOVER",
        },
        {
          title: "融资利率",
          dataIndex: "FINANCING_RATE",
          __percent: true,
          __reverse: true,
          __score: 0.5,
        },
      ],
    },
    {
      title: "偿债能力",
      children: [
        {
          title: "速动比率",
          dataIndex: "QUICK_RATIO",
        },
        {
          title: "自由现金",
          dataIndex: "CASH_DIFF",
          // __percent: true,
        },
      ],
    },
    {
      title: "上下游地位",
      children: [
        {
          title: "资金占用率",
          dataIndex: "OCCUPIED_FUNDS",
          __percent: true,
          __score: 0.5,
        },
      ],
    },
  ];

  const stats = useMemo(() => {
    function score(column, date, stats) {
      const { dataIndex: key, __stat = true, __reverse = false, __score = 1, children = [] } = column;
      if (__stat && key && key !== "SCORE") {
        const _stats = (stats[key] = {
          // count: 0,
          // sum: 0,
          values: [],
          // indexes: {},
        });
        // 统计所有数值
        for (const data of props.data) {
          // 排除没有数据的公司
          if (data[date]) {
            const value = data[date][key];
            if (typeof value === "number") {
              // _stats.count++;
              // _stats.sum += value;
              _stats.values.push(value);
              // 添加本期得分贡献列
              data[date].SCORES[key] = () => (_stats.values.length - _stats.indexes[value]) * __score;
            }
          }
        }
        // 对数值进行排序
        _stats.indexes = buildIndex(_stats.values.sort((a, b) => (b - a) * (__reverse ? -1 : 1)));
      }
      for (const child of children) {
        score(child, date, stats);
      }
    }

    const stats = {};
    for (const data of props.data) {
      for (const [k, d] of Object.entries(data)) {
        // 本期得分初始化
        if (REPORT_DATE_REG.test(k)) {
          d.SCORES = {};
        }
      }
    }
    // 计算五年内的日期
    for (const date of getDates(20)) {
      // 统计数据初始化
      stats[date] = {
        SCORE: {
          values: [],
        },
      };
      for (const column of rawColumns) {
        score(column, date, stats[date]);
      }
      for (const data of props.data) {
        if (data[date]) {
          // 本期得分初始化
          data[date].SCORE = Object.values(data[date].SCORES).reduce((acc, curr) => acc + curr(), 0);
          stats[date].SCORE.values.push(data[date].SCORE);
        }
      }
      stats[date].SCORE.indexes = buildIndex(stats[date].SCORE.values.sort((a, b) => b - a));
    }

    // 计算同比
    props.data.forEach((data) => addYOY(data, (key) => key === "SCORE"));

    return stats;
  }, [props.data]);

  const columns = useMemo(() => {
    function handleColumn(column) {
      const { dataIndex: key, __percent, __stat = true, title, children = [] } = column;
      const _stats = stats[props.date];
      if (key) {
        column.render =
          column.__render ||
          function (_, data) {
            let value = data[props.date]?.[key];
            const colored = /(YOY|CARG)$/.test(key);
            if (value !== undefined) {
              let result = value;
              if (__percent) {
                result = percent(value); // 百分比
              } else if (typeof value === "number") {
                result = formatNumber(value);
              }
              if (typeof value === "number") {
                result = (
                  <Button
                    size="sm"
                    color={colored ? (value > 0 ? "danger" : "success") : "default"}
                    variant={colored ? "flat" : "light"}
                    onPress={() => {
                      if (key.endsWith("YOY")) return;
                      setIsModalOpen(true);
                      setChartConfig({
                        data,
                        field: key,
                        title,
                        percent: __percent,
                      });
                    }}
                  >
                    {result}
                  </Button>
                );
              }
              if (__stat) {
                let i = _stats[key].indexes[value];
                result = (
                  <>
                    {result}
                    <span
                      // count={stats[dataIndex]?.values.indexOf(value) + 1}
                      // size="small"
                      // color="#0006"
                      style={{
                        marginLeft: "4px",
                        verticalAlign: "super",
                        fontSize: "12px",
                        // color: '#',
                        // opacity: 0.5,
                        // transform: 'scale(0.6)',
                        color: i < _stats[key].values.length / 2 ? "red" : "green",
                      }}
                    >
                      {i + 1}
                      {/* {i < stats[dataIndex].values.length / 2 ? '↑' : '↓'} */}
                    </span>
                  </>
                );
              }
              return result;
            }
          };
        column.__summary = () => {
          const value = _stats[key] ? _stats[key].values[Math.floor(_stats[key].values.length / 2)] : null;
          return typeof value === "number" ? (__percent ? percent(value) : formatNumber(value)) : null;
        };
        column.sorter = (a, b) => get(a, [props.date, key], 0) - get(b, [props.date, key], 0);
      }

      for (const child of children) {
        handleColumn(child);
      }
    }
    for (const column of rawColumns) {
      handleColumn(column);
    }
    return rawColumns;
  }, [stats, props.date]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartConfig, setChartConfig] = useState({
    data: null,
    field: null,
  });
  return (
    <>
      <Table data={props.data} columns={columns} loading={props.loading} rowKey="CODE" />
      <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen} size="5xl">
        <ModalContent>
          {() => (
            <>
              <ModalHeader>{chartConfig.title}</ModalHeader>
              <ModalBody>
                <Indicator {...chartConfig} />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
