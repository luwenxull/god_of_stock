import {
  calculateCAGR,
  getDates,
  getPrevQuarter,
  getRelativeDate,
  getValues,
} from "@/app/util";
import zlib from "zlib";
import fs from "fs";
// import path from 'path'

function genCARG3(data, key, date) {
  const [value, prevValue] = getValues(data, key, [
    date,
    getRelativeDate(date, -3),
  ]);
  if (typeof value === "number" && typeof prevValue === "number") {
    return calculateCAGR(prevValue, value, 3);
  }
}

function guardNaN(obj) {
  Object.keys(obj).forEach((key) => {
    if (Number.isNaN(obj[key])) {
      obj[key] = undefined;
    }
  });
  return obj;
}

function get(data, keys, dft) {
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

function buildKeyfigure(records) {
  return records.map((data) =>
    getDates(20).reduce(
      (keyfigure, date) => {
        function _getA(data, key, dft) {
          return get(data, [date, key], dft);
        }

        function _getQ(data, key, dft) {
          if (date.split("-")[1] === "03") {
            return _getA(data, key, dft);
          }
          return (
            _getA(data, key, dft) - get(data, [getPrevQuarter(date), key], dft)
          );
        }

        function _get(data, key, dft) {
          return [_getA(data, key, dft), _getQ(data, key, dft)];
        }

        const [CORE_PROFIT, CORE_PROFIT_Q] = _get(
          data.profit,
          (profit) =>
            get(profit, ["OPERATE_INCOME"]) -
            (get(profit, ["OPERATE_COST"]) +
              get(profit, ["SALE_EXPENSE"], 0) +
              get(profit, ["MANAGE_EXPENSE"], 0) +
              get(profit, ["RESEARCH_EXPENSE"], 0) +
              get(profit, ["FINANCE_EXPENSE"], 0) +
              get(profit, ["OPERATE_TAX_ADD"], 0))
        );

        const OPERATE_INCOME_CARG = genCARG3(
          data.profit,
          "OPERATE_INCOME",
          date
        );
        const OPERATE_COST_CARG = genCARG3(data.profit, "OPERATE_COST", date);
        const GROSS_PROFIT =
          _getA(data.profit, "OPERATE_INCOME") -
          _getA(data.profit, "OPERATE_COST");
        keyfigure[date] = guardNaN({
          SECURITY_NAME_ABBR: _getA(data.profit, "SECURITY_NAME_ABBR", ""),
          SECURITY_CODE: _getA(data.profit, "SECURITY_CODE", ""),
          SECUCODE: _getA(data.profit, "SECUCODE", ""),
          OPERATE_INCOME: _getA(data.profit, "OPERATE_INCOME"),
          OPERATE_INCOME_Q: _getQ(data.profit, "OPERATE_INCOME"),
          OPERATE_INCOME_CARG,
          OPERATE_INCOME_CARG_DIFF_COST:
            OPERATE_INCOME_CARG - OPERATE_COST_CARG,
          OPERATE_COST: _getA(data.profit, "OPERATE_COST"),
          OPERATE_COST_Q: _getQ(data.profit, "OPERATE_COST"),
          OPERATE_COST_CARG,
          GROSS_PROFIT,
          CORE_PROFIT,
          CORE_PROFIT_Q,
          NETPROFIT: _getA(data.profit, "NETPROFIT"),
          NETPROFIT_Q: _getQ(data.profit, "NETPROFIT"),
          NETPROFIT_CARG: genCARG3(data.profit, "NETPROFIT", date),
          ROE:
            _getA(data.profit, "NETPROFIT") /
            _getA(data.balance, "TOTAL_EQUITY"),
          ROA:
            _getA(data.profit, "NETPROFIT") /
            _getA(data.balance, "TOTAL_ASSETS"),
          GPM: GROSS_PROFIT / _getA(data.profit, "OPERATE_INCOME"),
          CPM: CORE_PROFIT / _getA(data.profit, "OPERATE_INCOME"), // 核心利润率
          CPM_GPM: CORE_PROFIT / GROSS_PROFIT, // 核心利润率与毛利率的比值
          NPM:
            _getA(data.profit, "NETPROFIT") /
            _getA(data.profit, "OPERATE_INCOME"),
          NPM_CPM: _getA(data.profit, "NETPROFIT") / CORE_PROFIT,
          OCCUPIED_FUNDS:
            (_getA(data.balance, "ADVANCE_RECEIVABLES", 0) +
              _getA(data.balance, "CONTRACT_LIAB", 0) +
              _getA(data.balance, "NOTE_ACCOUNTS_PAYABLE", 0) -
              _getA(data.balance, "NOTE_ACCOUNTS_RECE", 0) -
              _getA(data.balance, "CONTRACT_ASSET", 0) -
              _getA(data.balance, "PREPAYMENT", 0)) /
            _getA(data.profit, "OPERATE_INCOME"),
          SALES_SERVICES: _getA(data.cash, "NETCASH_OPERATE"), // 销售服务现金流
          // 收现比
          CASH_INCOME:
            _getA(data.cash, "SALES_SERVICES") /
            _getA(data.profit, "OPERATE_INCOME"), // 现金收入占比
          // 净现比
          // CASH_COREPROFIT: _getA(data.cash, 'NETCASH_OPERATE') / CORE_PROFIT, // 现金净利润占比
          RECEIVABLE_TURNOVER:
            _getA(data.profit, "OPERATE_INCOME") /
            _getA(data.balance, "NOTE_ACCOUNTS_RECE"),
          ASSET_TURNOVER:
            _getA(data.profit, "OPERATE_INCOME") /
            _getA(data.balance, "TOTAL_ASSETS"),
          INVENTORY_TURNOVER:
            _getA(data.profit, "OPERATE_COST") /
            _getA(data.balance, "INVENTORY"),
          // 存货占比
          INVENTORY_ASSETS:
            _getA(data.balance, "INVENTORY") /
            _getA(data.balance, "TOTAL_ASSETS"),
          // 存货三年增速
          INVENTORY_CARG: genCARG3(data.balance, "INVENTORY", date),
          // 应收账款占比
          NOTE_ACCOUNTS_RECE_ASSETS:
            _getA(data.balance, "NOTE_ACCOUNTS_RECE") /
            _getA(data.balance, "TOTAL_ASSETS"),
          NOTE_ACCOUNTS_RECE_CARG: genCARG3(
            data.balance,
            "NOTE_ACCOUNTS_RECE",
            date
          ), // 应收账款三年增速
          // 总资产
          TOTAL_ASSETS: _getA(data.balance, "TOTAL_ASSETS"),
          // 负债占比
          LIAB_ASSETS:
            _getA(data.balance, "TOTAL_LIABILITIES") /
            _getA(data.balance, "TOTAL_ASSETS"),
          // 流动比率
          CURRENT_RATIO:
            _getA(data.balance, "CURRENT_ASSETS") /
            _getA(data.balance, "CURRENT_LIAB"),
          // 速动比率
          QUICK_RATIO:
            (_getA(data.balance, "TOTAL_CURRENT_ASSETS") -
              _getA(data.balance, "INVENTORY")) /
            _getA(data.balance, "TOTAL_CURRENT_LIAB"),
          // ORDER:
          //   (_get(data.balance, 'ADVANCE_RECEIVABLES') +
          //     _get(data.balance, 'CONTRACT_LIAB')) /
          //   _get(data.profit, 'OPERATE_INCOME'),
          // 总资产现金回收率
          CASH_RECOVERY:
            _getA(data.cash, "NETCASH_OPERATE") /
            _getA(data.balance, "TOTAL_ASSETS"),

          // PERIOD_COST:
          //   (_get(data.profit, 'FINANCE_EXPENSE', 0) +
          //     _get(data.profit, 'RESEARCH_EXPENSE', 0) +
          //     _get(data.profit, 'SALE_EXPENSE', 0) +
          //     _get(data.profit, 'MANAGE_EXPENSE', 0)) /
          //   _get(data.profit, 'OPERATE_INCOME'),
          // 坏账率
          // BAD_DEBT:
          //   (_get(data.profit, 'CREDIT_IMPAIRMENT_LOSS') /
          //     (_get(data.balance, 'NOTE_ACCOUNTS_RECE') +
          //       get(data.balance, [getRelativeDate(date, -1), 'NOTE_ACCOUNTS_RECE']))) *
          //   2,

          CASH_DIFF:
            (_getA(data.balance, "MONETARYFUNDS", 0) +
              _getA(data.balance, "LEND_FUND", 0) +
              _getA(data.balance, "TRADE_FINASSET_NOTFVTPL", 0) +
              _getA(data.balance, "NONCURRENT_ASSET_1YEAR", 0)) -
            (_getA(data.balance, "SHORT_LOAN", 0) +
              _getA(data.balance, "BORROW_FUND", 0) +
              _getA(data.balance, "TRADE_FINLIAB_NOTFVTPL", 0) +
              _getA(data.balance, "NONCURRENT_LIAB_1YEAR", 0)),
          BAD_DEBT:
            (_getA(data.profit, "ASSET_IMPAIRMENT_INCOME", 0) +
              _getA(data.profit, "CREDIT_IMPAIRMENT_INCOME", 0) +
              _getA(data.profit, "ASSET_IMPAIRMENT_LOSS", 0) +
              _getA(data.profit, "CREDIT_IMPAIRMENT_LOSS", 0)) /
            _getA(data.balance, "TOTAL_ASSETS"),
        });
        return keyfigure;
      },
      {
        CODE: data.code,
      }
    )
  );
}

export async function POST(request) {
  const records = await request.json();

  for (const [type, data] of Object.entries(records)) {
    for (const val of data) {
      let obj = {};
      try {
        obj = JSON.parse(
          fs.readFileSync(
            `${process.cwd()}/data/ent_v2/${val.SECURITY_CODE}.json`,
            "utf8"
          )
        );
      } catch (e) {
        console.error(e.message);
      }
      if (!obj[type]) {
        obj[type] = {}; // 写入到对应的报表字段
      }
      obj[type][val.REPORT_DATE.split(" ")[0]] = Object.entries(val).reduce(
        (acc, [key, value]) => {
          if (value !== null) {
            acc[key] = value;
          }
          return acc;
        },
        {}
      );
      fs.writeFileSync(
        `${process.cwd()}/data/ent_v2/${val.SECURITY_CODE}.json`,
        JSON.stringify(obj)
      );
    }
  }

  return Response.json("OK");
}

export async function GET(request) {
  const code = request.nextUrl.searchParams.get("code");
  const data = code.split(",").map((code) => {
    try {
      return {
        ...JSON.parse(
          fs.readFileSync(`${process.cwd()}/data/ent_v2/${code}.json`, "utf8")
        ),
        code,
      };
    } catch (e) {
      console.error(e.message);
      return {
        profit: {},
        balance: {},
        cash: {},
        code,
      };
    }
  });

  const result = await new Promise((rsv, rjc) => {
    zlib.gzip(JSON.stringify(buildKeyfigure(data)), (err, result) => {
      if (err) {
        rjc(err);
      } else {
        rsv(result);
      }
    });
  });
  return new Response(result, {
    headers: {
      "Content-Type": "application/json",
      "Content-Encoding": "gzip",
    },
  })
}
