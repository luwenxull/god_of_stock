"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Checkbox,
  Chip,
  NextUIProvider,
  Select,
  SelectItem,
  SelectSection,
} from "@nextui-org/react";
import { getEntsOfSameInd, getReportDates, handleEntData, IND_TYPES, REPORT_TYPES } from "./util";
import Keyfigure from "./components/Keyfigure";
import ChooseByInd from "./components/ChooseByInd";

export default function App() {
  const [indType, setIndType] = useState(new Set(["SHENWAN"])); // 行业
  const [ent, setEnt] = useState(""); // 公司
  const [autoCompare, setAutoCompare] = useState(false); // 对比公司
  const [entsInfo, setEntsInfo] = useState(null);
  const [reportType, setReportType] = useState(new Set(["quarter_cumulative"]));
  const [reportDate, setReportDate] = useState(new Set(["2024-09-30"]));
  const ref = useRef(null);
  const reportTypeString = Array.from(reportType).join(",");
  const reportDateString = Array.from(reportDate).join(",");
  const indTypeString = Array.from(indType).join(",");

  useEffect(() => {
    fetch(`/api/ent?type=${indTypeString}`)
      .then((res) => res.json())
      .then((data) => {
        const info = handleEntData(
          data.filter((e) => !/^(20|900)/.test(e.SECCODE)),
          indTypeString
        );
        setEntsInfo(info);
        if (ent && !info.entDic[ent]) {
          setEnt("");
        }
      });
  }, [indTypeString]);

  const displayedEnts = useMemo(() => {
    if (!ent) {
      return [];
    }
    const _ent = entsInfo.entDic[ent];
    return autoCompare ? getEntsOfSameInd(_ent, entsInfo) : [_ent];
  }, [ent, autoCompare, entsInfo]);

  return (
    <NextUIProvider className="flex flex-col h-dvh">
      <div className="flex gap-4 p-2 items-center">
        <Select
          className="max-w-60"
          label="选择行业类型"
          selectedKeys={indType}
          onSelectionChange={setIndType}
          disallowEmptySelection
        >
          {IND_TYPES.map((ind) => (
            <SelectItem key={ind.value}>{ind.label}</SelectItem>
          ))}
        </Select>
        <Autocomplete className="max-w-60" label="选择公司" isVirtualized selectedKey={ent} onSelectionChange={setEnt}>
          {(entsInfo?.options || []).map((ent) => (
            <AutocompleteItem key={ent.value}>{ent.label}</AutocompleteItem>
          ))}
        </Autocomplete>
        <Select className="max-w-60" label="选择报告类型" selectedKeys={reportType} onSelectionChange={setReportType}>
          {REPORT_TYPES.map((rt) => (
            <SelectItem key={rt.value}>{rt.label}</SelectItem>
          ))}
        </Select>
        <Select className="max-w-60" label="选择报告期" selectedKeys={reportDate} onSelectionChange={setReportDate}>
          {getReportDates(reportTypeString).map((rd) => {
            return reportTypeString === "annual" ? (
              <SelectItem key={rd.value}>{rd.label}</SelectItem>
            ) : (
              <SelectSection key={rd.label} title={rd.label}>
                {rd.options.map((opt) => (
                  <SelectItem key={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectSection>
            );
          })}
        </Select>
        <div className="grow" />
        <Button
          color="primary"
          onPress={() => {
            debugger;
            if (ref.current) {
              ref.current.refresh();
            }
          }}
        >
          刷新
        </Button>
      </div>
      <div className="flex gap-1 px-2 items-center">
        <Checkbox isSelected={autoCompare} onValueChange={setAutoCompare} size="sm">
          自动对比同行
        </Checkbox>
        {ent
          ? [/*"F002V",*/ "F004V", "F005V", "F006V", "F007V"].map((key) => (
              <Chip size="sm" color="success" variant="flat" key={key}>
                {entsInfo.entDic[ent][key]}
              </Chip>
            ))
          : null}
      </div>
      <div style={{ flex: "1 0 0" }} className="overflow-hidden">
        <Keyfigure ents={displayedEnts} date={reportDateString} indType={indTypeString} ref={ref} />
        {/* {entsInfo ? <ChooseByInd indDic={entsInfo.indDic} /> : null} */}
      </div>
    </NextUIProvider>
  );
}
