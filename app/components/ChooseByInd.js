"use client";

import { Listbox, ListboxItem } from "@nextui-org/react";
import { useState } from "react";

export default function ChooseByInd(props) {
  const [list, setList] = useState([props.indDic]);
  const [selecatedKeys, setSelecatedKeys] = useState([new Set()]);
  return (
    <div className="flex gap-4 p-2 items-start h-full">
      {list.map((item, i) => {
        return (
          <Listbox
            key={i}
            className="max-w-xs h-full"
            onSelectionChange={(key) => {
              debugger;
              setList([...list.slice(0, i + 1), item[Array.from(key).toString()]]);
              setSelecatedKeys([...selecatedKeys.slice(0, i), key]);
            }}
            selectionMode="single"
            selectedKeys={selecatedKeys[i]}
          >
            {Object.entries(item).map(([key, value]) => {
              return key !== "__name" ? <ListboxItem key={key}>{value.__name || value.SECNAME}</ListboxItem> : null;
            })}
          </Listbox>
        );
      })}
    </div>
  );
}
