import { calculateCAGR, get, getDates, getFirstQuarter, getPrevQuarter, getRelativeDate } from "@/app/util";
import zlib from "zlib";
import fs from "fs";
// import path from 'path'

function genCARG3(data, key, date) {
  const [value, prevValue] = [date, getRelativeDate(date, -3)].map((date) => get(data, [date, key]));
  if (typeof value === "number" && typeof prevValue === "number") {
    return calculateCAGR(prevValue, value, 3);
  }
}

// function getAVG3(data, key, date) {
//   const values = [
//     date,
//     getRelativeDate(date, -1),
//     getRelativeDate(date, -2),
//   ].map((date) => get(data, [date, key]));
//   if (values.every((value) => typeof value === "number")) {
//     return values.reduce((acc, value) => acc + value, 0) / 3;
//   }
// }

function removeNaN(obj) {
  Object.keys(obj).forEach((key) => {
    if (Number.isNaN(obj[key])) {
      obj[key] = undefined;
    }
  });
  return obj;
}

function checkNumber(val, dft = 0) {
  if (Number.isNaN(val)) {
    return dft;
  }
  if (val === Infinity) {
    return 9999;
  }
  if (val === -Infinity) {
    return -9999;
  }
  return val;
}

function buildKeyfigure(records) {
  return records.map((data) =>
    getDates(20).reduce(
      (keyfigure, date) => {
        function _gp(key, dft = 0) {
          return get(data.profit, [date, key], dft);
        }

        function _gb(key, dft = 0) {
          return get(data.balance, [date, key], dft);
        }

        function _gc(key, dft = 0) {
          return get(data.cash, [date, key], dft);
        }

        function _g_avg(data, dates, key, dft = 0) {
          const values = dates.map((date) => get(data, [date, key])).filter((value) => typeof value === "number");
          if (values.length === 0) {
            return dft;
          }
          return values.reduce((acc, value) => acc + value, 0) / values.length;
        }

        function _getA(data, key, dft) {
          return get(data, [date, key], dft);
        }

        function _getQ(data, key, dft) {
          if (date.split("-")[1] === "03") {
            return _getA(data, key, dft);
          }
          return _getA(data, key, dft) - get(data, [getPrevQuarter(date), key], dft);
        }

        // const [CORE_PROFIT, CORE_PROFIT_Q] = _get(
        //   data.profit,
        //   (profit) =>
        //     get(profit, ["OPERATE_INCOME"]) -
        //     (get(profit, ["OPERATE_COST"]) +
        //       get(profit, ["SALE_EXPENSE"], 0) +
        //       get(profit, ["MANAGE_EXPENSE"], 0) +
        //       get(profit, ["RESEARCH_EXPENSE"], 0) +
        //       get(profit, ["FINANCE_EXPENSE"], 0) +
        //       get(profit, ["OPERATE_TAX_ADD"], 0))
        // );

        const OPERATE_INCOME_CARG = genCARG3(data.profit, "OPERATE_INCOME", date);
        const OPERATE_COST_CARG = genCARG3(data.profit, "OPERATE_COST", date);
        const GROSS_PROFIT = _gp("OPERATE_INCOME") - _gp("OPERATE_COST");
        const CORE_PROFIT =
          GROSS_PROFIT -
          _gp("SALE_EXPENSE") -
          _gp("MANAGE_EXPENSE") -
          _gp("RESEARCH_EXPENSE") -
          _gp("FINANCE_EXPENSE") -
          _gp("OPERATE_TAX_ADD");
        /* 理杏仁算法 */
        // const INTEREST_DEBT =
        //   _gb("TOTAL_LIABILITIES") -
        //   (_gb("NOTE_ACCOUNTS_PAYABLE") +
        //     _gb("ADVANCE_RECEIVABLES") +
        //     _gb("CONTRACT_LIAB") +
        //     _gb("STAFF_SALARY_PAYABLE") +
        //     _gb("TAX_PAYABLE") +
        //     _gb("TOTAL_OTHER_PAYABLE") +
        //     _gb("OTHER_CURRENT_LIAB")) -
        //   (_gb("TOTAL_NONCURRENT_LIAB") - _gb("LONG_LOAN") - _gb("BOND_PAYABLE") - _gb("LEASE_LIAB"));

        /* 简单算法 */
        const INTEREST_DEBT =
          _gb("SHORT_LOAN") +
          _gb("LONG_LOAN") +
          _gb("NONCURRENT_LIAB_1YEAR") +
          _gb("BOND_PAYABLE") +
          _gb("LONG_PAYABLE");

        const INTEREST_DEBT_AVG =
          _g_avg(data.balance, [date, getFirstQuarter(date)], "SHORT_LOAN") +
          _g_avg(data.balance, [date, getFirstQuarter(date)], "LONG_LOAN") +
          _g_avg(data.balance, [date, getFirstQuarter(date)], "NONCURRENT_LIAB_1YEAR") +
          _g_avg(data.balance, [date, getFirstQuarter(date)], "BOND_PAYABLE") +
          _g_avg(data.balance, [date, getFirstQuarter(date)], "LONG_PAYABLE");

        // (期末.负债合计 - (期末.应付票据及应付账款 + 期末.预收账款 + 期末.合同负债 + 期末.应付职工薪酬 + 期末.应交税费 + 期末.其他应付款 + 期末.其他流动负债) - (期末.非流动负债合计 - 期末.长期借款 - 期末.应付债券 - 期末.租赁负债)) / 期末.资产总计
        const INTEREST_DEBT_RATIO = INTEREST_DEBT / _gb("TOTAL_ASSETS");
        const HEAVY_ASSETS = _gb("FIXED_ASSET") + _gb("CIP") + _gb("PRODUCTIVE_BIOLOGY_ASSET") + _gb("USERIGHT_ASSET");

        keyfigure[date] = removeNaN({
          // SECURITY_NAME_ABBR: _getA(data.profit, "SECURITY_NAME_ABBR", ""),
          // SECURITY_CODE: _getA(data.profit, "SECURITY_CODE", ""),
          // SECUCODE: _getA(data.profit, "SECUCODE", ""),
          OPERATE_INCOME: _gp("OPERATE_INCOME"),
          // OPERATE_INCOME_Q: _getQ(data.profit, "OPERATE_INCOME"),
          OPERATE_INCOME_CARG,
          OPERATE_INCOME_DIFF_COST_CARG: OPERATE_INCOME_CARG - OPERATE_COST_CARG,
          OPERATE_COST: _gp("OPERATE_COST"),
          // OPERATE_COST_Q: _getQ(data.profit, "OPERATE_COST"),
          OPERATE_COST_CARG,
          GROSS_PROFIT,
          CORE_PROFIT,
          // CORE_PROFIT_Q,
          NETPROFIT: _gp("NETPROFIT"),
          // NETPROFIT_Q: _getQ(data.profit, "NETPROFIT"),
          NETPROFIT_CARG: genCARG3(data.profit, "NETPROFIT", date),
          ROE: _gp("NETPROFIT") / _g_avg(data.balance, [date, getFirstQuarter(date)], "TOTAL_EQUITY"),
          ROA: _gp("NETPROFIT") / _g_avg(data.balance, [date, getFirstQuarter(date)], "TOTAL_ASSETS"),
          GPM: GROSS_PROFIT / _gp("OPERATE_INCOME"),
          CPM: CORE_PROFIT / _gp("OPERATE_INCOME"), // 核心利润率
          CPM_GPM: CORE_PROFIT / GROSS_PROFIT, // 核心利润率与毛利率的比值
          NPM: _gp("NETPROFIT") / _gp("OPERATE_INCOME"),
          // NPM_CPM: _getA(data.profit, "NETPROFIT") / CORE_PROFIT,
          OCCUPIED_FUNDS:
            (_gb("ADVANCE_RECEIVABLES") +
              _gb("CONTRACT_LIAB") +
              _gb("NOTE_ACCOUNTS_PAYABLE") -
              _gb("NOTE_ACCOUNTS_RECE") -
              _gb("CONTRACT_ASSET") -
              _gb("PREPAYMENT")) /
            _gb("TOTAL_ASSETS"),
          SALES_SERVICES: _gc("NETCASH_OPERATE"), // 销售服务现金流
          // 收现比
          CASH_INCOME: _gc("SALES_SERVICES") / _gp("OPERATE_INCOME"), // 现金收入占比
          // 净现比
          // CASH_COREPROFIT: _getA(data.cash, 'NETCASH_OPERATE') / CORE_PROFIT, // 现金净利润占比
          RECEIVABLE_TURNOVER: checkNumber(_gp("OPERATE_INCOME") / _gb("NOTE_ACCOUNTS_RECE")),
          ASSET_TURNOVER: _gp("OPERATE_INCOME") / _gb("TOTAL_ASSETS"),
          INVENTORY_TURNOVER: checkNumber(_gp("OPERATE_COST") / _gb("INVENTORY"), 0),
          // 存货占比
          INVENTORY_ASSETS: _gb("INVENTORY") / _gb("TOTAL_ASSETS"),
          // 存货三年增速
          // INVENTORY_CARG: genCARG3(data.balance, "INVENTORY", date),
          // 应收账款占比
          NOTE_ACCOUNTS_RECE_ASSETS: _gb("NOTE_ACCOUNTS_RECE") / _gb("TOTAL_ASSETS"),
          // 应收账款三年增速
          OPERATE_INCOME_DIFF_NAR_CARG: OPERATE_INCOME_CARG - genCARG3(data.balance, "NOTE_ACCOUNTS_RECE", date),
          // NOTE_ACCOUNTS_RECE_CARG: genCARG3(
          //   data.balance,
          //   "NOTE_ACCOUNTS_RECE",
          //   date
          // ), // 应收账款三年增速
          // 总资产
          // TOTAL_ASSETS: _getA(data.balance, "TOTAL_ASSETS"),
          // 负债占比
          LIAB_ASSETS: _gb("TOTAL_LIABILITIES") / _gb("TOTAL_ASSETS"),
          // 流动比率
          // CURRENT_RATIO:
          //   _getA(data.balance, "CURRENT_ASSETS") /
          //   _getA(data.balance, "CURRENT_LIAB"),
          // 速动比率
          QUICK_RATIO: (_gb("TOTAL_CURRENT_ASSETS") - _gb("INVENTORY")) / _gb("TOTAL_CURRENT_LIAB"),
          // ORDER:
          //   (_get(data.balance, 'ADVANCE_RECEIVABLES') +
          //     _get(data.balance, 'CONTRACT_LIAB')) /
          //   _get(data.profit, 'OPERATE_INCOME'),
          // 总资产现金回收率
          CASH_RECOVERY: _gc("NETCASH_OPERATE") / _gb("TOTAL_ASSETS"),
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
          INTEREST_DEBT_RATIO,
          CASH_DIFF:
            _gb("MONETARYFUNDS") +
            _gb("LEND_FUND") +
            _gb("TRADE_FINASSET_NOTFVTPL") +
            _gb("NONCURRENT_ASSET_1YEAR") -
            (_gb("SHORT_LOAN") + _gb("BORROW_FUND") + _gb("TRADE_FINLIAB_NOTFVTPL") + _gb("NONCURRENT_LIAB_1YEAR")),
          DEPRECIATION: (_gp("ASSET_IMPAIRMENT_INCOME") + _gp("ASSET_IMPAIRMENT_LOSS")) / _gb("TOTAL_EQUITY"),
          BAD_DEBT: (_gp("CREDIT_IMPAIRMENT_LOSS") + _gp("CREDIT_IMPAIRMENT_INCOME")) / _gb("TOTAL_EQUITY"),
          NETPROFIT_HEAVY_ASSETS: _gp("NETPROFIT") / HEAVY_ASSETS,
          // FINANCING_RATE: INTEREST_DEBT_AVG === 0 ? 0 : _gp("FE_INTEREST_EXPENSE") / INTEREST_DEBT_AVG,
          LPE: _gb("LONG_PREPAID_EXPENSE") / _gb("TOTAL_EQUITY"),
          GOODWILL: _gb("GOODWILL") / _gb("TOTAL_EQUITY"),
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
        obj = JSON.parse(fs.readFileSync(`${process.cwd()}/data/ent_v2/${val.SECURITY_CODE}.json`, "utf8"));
      } catch (e) {
        console.error(e.message);
      }
      if (!obj[type]) {
        obj[type] = {}; // 写入到对应的报表字段
      }
      obj[type][val.REPORT_DATE.split(" ")[0]] = Object.entries(val).reduce((acc, [key, value]) => {
        if (value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {});
      fs.writeFileSync(`${process.cwd()}/data/ent_v2/${val.SECURITY_CODE}.json`, JSON.stringify(obj));
    }
  }
  return new Response("OK");
}

export async function GET(request) {
  const code = request.nextUrl.searchParams.get("code");
  const data = code.split(",").map((code) => {
    try {
      return JSON.parse(fs.readFileSync(`${process.cwd()}/data/ent_v2/${code}.json`, "utf8"));
    } catch (e) {
      // console.error(e.message);
      return {
        profit: {},
        balance: {},
        cash: {},
      };
    }
  });
  return new Promise((rsv, rjc) => {
    zlib.gzip(JSON.stringify(buildKeyfigure(data)), (err, result) => {
      if (err) {
        rjc(err);
      } else {
        rsv(
          new Response(result, {
            headers: {
              "Content-Type": "application/json",
              "Content-Encoding": "gzip",
            },
          })
        );
      }
    });
  });
}
