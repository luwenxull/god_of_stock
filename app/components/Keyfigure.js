"use client";

import { useMemo, useState, useEffect, useImperativeHandle } from "react";
import {
  Button,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "@nextui-org/react";
import { addYOY, buildIndex, formatNumber, get, getDates, getMarket, percent, REPORT_DATE_REG } from "../util.js";
import Indicator from "./Indicator.js";
import Table from "./Table.js";

function StarIcon(props) {
  return (
    <svg viewBox="0 0 1024 1024" className="cursor-pointer" width="12" height="12" onClick={props.onClick}>
      <path
        fill={props.fill}
        d="M908.1 353.1l-253.9-36.9L540.7 86.1c-3.1-6.3-8.2-11.4-14.5-14.5-15.8-7.8-35-1.3-42.9 14.5L369.8 316.2l-253.9 36.9c-7 1-13.4 4.3-18.3 9.3-12.3 12.7-12.1 32.9 0.6 45.3l183.7 179.1-43.4 252.9c-1.2 6.9-0.1 14.1 3.2 20.3 8.2 15.6 27.6 21.7 43.2 13.4L512 754l227.1 119.4c6.2 3.3 13.4 4.4 20.3 3.2 17.4-3 29.1-19.5 26.1-36.9l-43.4-252.9 183.7-179.1c5-4.9 8.3-11.3 9.3-18.3 2.7-17.5-9.5-33.7-27-36.3zM664.8 561.6l36.1 210.3L512 672.7 323.1 772l36.1-210.3-152.8-149L417.6 382 512 190.7 606.4 382l211.2 30.7-152.8 148.9z"
        p-id="7474"
      ></path>
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 1024 1024" className="cursor-pointer" width="12" height="12">
      <path
        d="M725.333333 149.333333H298.666667A192.298667 192.298667 0 0 0 106.666667 341.333333v554.666667a21.333333 21.333333 0 0 0 13.226666 19.626667 18.474667 18.474667 0 0 0 8.106667 1.706666 20.010667 20.010667 0 0 0 14.933333-6.4l103.253334-102.826666a64 64 0 0 1 45.226666-18.773334H725.333333a192.298667 192.298667 0 0 0 192-192V341.333333A192.298667 192.298667 0 0 0 725.333333 149.333333z m-384 373.333334A53.333333 53.333333 0 1 1 394.666667 469.333333 53.333333 53.333333 0 0 1 341.333333 522.666667z m170.666667 0A53.333333 53.333333 0 1 1 565.333333 469.333333 53.333333 53.333333 0 0 1 512 522.666667z m170.666667 0A53.333333 53.333333 0 1 1 736 469.333333 53.333333 53.333333 0 0 1 682.666667 522.666667z"
        fill="#2c2c2c"
        p-id="5920"
      ></path>
    </svg>
  );
}

function Comment(props) {
  const [inEditMode, setInEditMode] = useState(false);
  const [content, setContent] = useState(props.content || "");
  return inEditMode ? (
    <Input
      size="sm"
      placeholder="输入笔记内容"
      value={content}
      onValueChange={setContent}
      endContent={
        <Button
          size="sm"
          variant="light"
          isIconOnly
          onPress={() => {
            props.onSave(content);
          }}
        >
          <svg viewBox="0 0 1024 1024" width="12" height="12">
            <path
              d="M874.322026 254.904551l-389.17358 506.198877c-3.530406 4.594645-8.861832 7.480368-14.643512 7.930623-0.532119 0.040932-1.054005 0.061398-1.586125 0.061398-5.229095 0-10.284227-2.00568-14.101159-5.64865l-210.013131-199.8824-32.397874 42.149982c-6.897084 8.953929-19.739577 10.642384-28.703739 3.745301-8.964162-6.886851-10.642384-19.739577-3.745301-28.693506l46.263673-60.180638c3.540639-4.594645 8.861832-7.480368 14.643512-7.930623s11.491729 1.586125 15.687284 5.587252l210.013131 199.8824 375.297548-488.168222c6.897084-8.964162 19.739577-10.642384 28.703739-3.755534C879.530654 233.097896 881.208876 245.940388 874.322026 254.904551z"
              p-id="17730"
            ></path>
          </svg>
        </Button>
      }
    />
  ) : (
    <Button size="sm" variant="light" isIconOnly onPress={setInEditMode}>
      <CommentIcon />
    </Button>
  );
}

export default function Keyfigure(props) {
  useImperativeHandle(props.ref, () => ({
    refresh: fetchData,
  }));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartConfig, setChartConfig] = useState({
    data: null,
    field: null,
  });
  const [source, setSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [marked, setMarked] = useState({});

  const rawColumns = [
    {
      title: "公司",
      fixed: "left",
      children: [
        {
          title: "代码",
          render: (_, data) => {
            const market = getMarket(data.SECCODE);
            return (
              <Popover placement="right">
                <PopoverTrigger>
                  <Button color="primary" size="sm" variant="bordered">
                    {data.SECCODE}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="p-2 flex gap-2 items-center">
                    <Button
                      size="sm"
                      variant="light"
                      isIconOnly
                      onPress={() => {
                        fetch(`/api/ent/marked?code=${data.SECCODE}`, {
                          method: "POST",
                          body: JSON.stringify({
                            f: get(marked, [data.SECCODE, "f"]) ? 0 : 1,
                          }),
                        })
                          .then((res) => res.json())
                          .then(setMarked);
                      }}
                    >
                      <StarIcon fill={get(marked, [data.SECCODE, "f"]) ? "red" : "gray"} />
                    </Button>
                    <Comment
                      content={get(marked, [data.SECCODE, "c"])}
                      onSave={(content) => {
                        fetch(`/api/ent/marked?code=${data.SECCODE}`, {
                          method: "POST",
                          body: JSON.stringify({
                            c: content,
                          }),
                        })
                          .then((res) => res.json())
                          .then(setMarked);
                      }}
                    />
                    <Button size="sm" variant="light">
                      <Link
                        href={`https://basic.10jqka.com.cn/astockph/briefinfo/index.html?showhead=0&code=${
                          data.SECCODE
                        }&marketid=${market === "SH" ? "17" : "33"}`}
                        target="_blank"
                        size="sm"
                      >
                        同花顺
                      </Link>
                    </Button>
                    <Button size="sm" variant="light">
                      <Link
                        href={`https://emweb.securities.eastmoney.com/pc_hsf10/pages/index.html?type=web&code=${
                          market + data.SECCODE
                        }&color=b#/cwfx`}
                        target="_blank"
                        size="sm"
                      >
                        东方财富
                      </Link>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            );
          },
          fixed: "left",
        },
        {
          title: "名称",
          render: (_, data) => {
            return (
              <div className="flex gap-1 items-center">
                <span>{data.SECNAME}</span>
                {get(marked, [data.SECCODE, "c"]) ? (
                  <Tooltip
                    content={<span className="text-xs">{get(marked, [data.SECCODE, "c"])}</span>}
                    isDisabled={!get(marked, [data.SECCODE, "c"])}
                    delay={1000}
                    color="primary"
                  >
                    <span>
                      <CommentIcon />
                    </span>
                  </Tooltip>
                ) : null}
                {get(marked, [data.SECCODE, "f"]) ? (
                  <StarIcon
                    onClick={() => {
                      fetch(`/api/ent/marked?code=${data.SECCODE}`, {
                        method: "POST",
                        body: JSON.stringify({
                          f: get(marked, [data.SECCODE, "f"]) ? 0 : 1,
                        }),
                      })
                        .then((res) => res.json())
                        .then(setMarked);
                    }}
                    fill="red"
                  />
                ) : null}
              </div>
            );
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
          __score: 2,
        },
        {
          title: "成本增速差",
          dataIndex: "OPERATE_INCOME_DIFF_COST_CARG",
          __percent: true,
          __score: 1,
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
          __score: 1,
        },
        {
          title: "同比",
          dataIndex: "CORE_PROFIT_YOY",
          __score: 0.5,
          __percent: true,
        },
        {
          title: "三年复合增速",
          dataIndex: "CORE_PROFIT_CARG",
          __percent: true,
          __score: 2,
        },
        {
          title: "净利润",
          dataIndex: "NETPROFIT",
          __score: 1,
        },
        {
          title: "同比",
          dataIndex: "NETPROFIT_YOY",
          __score: 0.5,
          __percent: true,
        },
        // {
        //   title: "三年复合增速",
        //   dataIndex: "NETPROFIT_CARG",
        //   __percent: true,
        //   __score: 2,
        // },
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
          __score: 0.5,
        },
        {
          title: "有息负债率",
          dataIndex: "INTEREST_DEBT_RATIO",
          __percent: true,
          __reverse: true,
        },
        {
          title: "存货占比",
          dataIndex: "INVENTORY_ASSETS",
          __percent: true,
          __reverse: true,
        },
        {
          title: "商誉占比",
          dataIndex: "GOODWILL",
          __percent: true,
          __reverse: true,
          __score: 0.5,
        },
        {
          title: "应收账款占比",
          dataIndex: "NOTE_ACCOUNTS_RECE_ASSETS",
          __percent: true,
          __reverse: true,
        },
        {
          title: "营收增速差",
          dataIndex: "OPERATE_INCOME_DIFF_NAR_CARG",
          __percent: true,
          __score: 1,
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
          title: "折旧损失",
          dataIndex: "DEPRECIATION",
          __percent: true,
          __score: 0.5,
        },
        {
          title: "坏账损失",
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
        {
          title: "产能扩张",
          dataIndex: "HEAVY_ASSETS_YOY",
          __percent: true,
          __score: 0,
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
        // {
        //   title: "融资利率",
        //   dataIndex: "FINANCING_RATE",
        //   __percent: true,
        //   __reverse: true,
        //   __score: 0.5,
        // },
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
        for (const data of source) {
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
    for (const data of source) {
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
      for (const data of source) {
        if (data[date]) {
          // 本期得分初始化
          data[date].SCORE = Object.values(data[date].SCORES).reduce((acc, curr) => acc + curr(), 0);
          stats[date].SCORE.values.push(data[date].SCORE);
        }
      }
      stats[date].SCORE.indexes = buildIndex(stats[date].SCORE.values.sort((a, b) => b - a));
    }

    // 计算同比
    source.forEach((data) => addYOY(data, (key) => key === "SCORE"));

    return stats;
  }, [source]);

  useEffect(() => {
    fetch("/api/ent/marked")
      .then((res) => res.json())
      .then((data) => {
        setMarked(data);
      });
  }, []);

  const columns = useMemo(() => {
    function handleColumn(column) {
      const { dataIndex: key, __percent, __stat = true, title, children = [] } = column;
      const _stats = stats[props.date];
      if (key) {
        column.render = function (_, data) {
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
                    style={{
                      marginLeft: "4px",
                      verticalAlign: "super",
                      fontSize: "12px",
                      color: i < _stats[key].values.length / 2 ? "red" : "green",
                    }}
                  >
                    {i + 1}
                  </span>
                </>
              );
            }
            return result;
          }
        };
        // column.__summary = () => {
        //   const value = _stats[key] ? _stats[key].values[Math.floor(_stats[key].values.length / 2)] : null;
        //   return typeof value === "number" ? (__percent ? percent(value) : formatNumber(value)) : null;
        // };
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
  }, [stats, marked, props.date]);

  function fetchData() {
    if (props.ents.length === 0) {
      // setSource([]);
      return;
    }
    setLoading(true);
    fetch(`/api/ent/report?code=${props.ents.map((ent) => ent.SECCODE).toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setSource(data.map((data, i) => Object.assign(addYOY(data), props.ents[i])));
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(fetchData, [props.ents]);

  return (
    <>
      <Table data={source} columns={columns} loading={loading} rowKey="SECCODE" />
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
