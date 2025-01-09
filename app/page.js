"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Chip,
  NextUIProvider,
  Select,
  SelectItem,
  SelectSection,
  Checkbox,
} from "@nextui-org/react";
import { addYOY, ENT_DIC, ENT_OPTIONS, getEntsOfSameInd, getReportDates, REPORT_TYPES } from "./util";
import Keyfigure from "./components/Keyfigure";

export default function App() {
  const [ent, setEnt] = useState("600031"); // 公司
  const [autoCompare, setAutoCompare] = useState(false); // 对比公司
  const [reportType, setReportType] = useState(new Set(["quarter_cumulative"]));
  const [reportDate, setReportDate] = useState(new Set(["2024-09-30"]));
  const [source, setSource] = useState([]);
  const [loading, setLoading] = useState(false);

  const ents = useMemo(() => {
    if (!ent) {
      return [];
    }
    return autoCompare ? getEntsOfSameInd(ent) : [ent];
  }, [ent, autoCompare]);

  function fetchData() {
    if (ents.length === 0) {
      setSource([]);
      return;
    }
    setLoading(true);
    fetch(`/api/ent/report?code=${ents.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setSource(data.map((data) => addYOY(data)));
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(fetchData, [ents]);

  const reportTypeString = Array.from(reportType).join(",");
  const reportDateString = Array.from(reportDate).join(",");

  return (
    <NextUIProvider className="flex flex-col h-dvh">
      <div className="flex gap-4 p-2 items-center">
        <Autocomplete className="max-w-xs" label="选择公司" isVirtualized selectedKey={ent} onSelectionChange={setEnt}>
          {ENT_OPTIONS.map((ent) => (
            <AutocompleteItem key={ent.value}>{ent.label}</AutocompleteItem>
          ))}
        </Autocomplete>
        <Select className="max-w-xs" label="选择报告类型" selectedKeys={reportType} onSelectionChange={setReportType}>
          {REPORT_TYPES.map((rt) => (
            <SelectItem key={rt.value}>{rt.label}</SelectItem>
          ))}
        </Select>
        <Select className="max-w-xs" label="选择报告期" selectedKeys={reportDate} onSelectionChange={setReportDate}>
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
        <Button color="primary" onPress={fetchData}>
          刷新
        </Button>
      </div>
      <div className="flex gap-1 px-2 items-center">
        {ent
          ? [/*"F002V",*/ "F004V", "F005V", "F006V"].map((key) => (
              <Chip size="sm" color="success" variant="flat" key={key}>
                {ENT_DIC[ent][key]}
              </Chip>
            ))
          : null}
        <Checkbox isSelected={autoCompare} onValueChange={setAutoCompare} size="sm">
          自动对比同行
        </Checkbox>
      </div>
      <div style={{ flex: "1 0 0" }} className="overflow-hidden">
        <Keyfigure data={source} date={reportDateString} loading={loading} />
      </div>
    </NextUIProvider>
  );
}
