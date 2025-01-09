"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Pagination, Progress } from "@nextui-org/react";

import styles from "./Table.module.scss";
import { findDeepest } from "../util";
function groupByDepth(cols) {
  const groups = [];
  while (cols.length) {
    groups.push(cols);
    const next = [];
    for (const col of cols) {
      if (col.children && col.children.length) {
        next.push(...col.children);
      }
    }
    cols = next;
  }
  return groups;
}

function addId(cols) {
  for (const col of cols) {
    col.id = Math.random().toString(36).slice(2);
    if (col.children && col.children.length) {
      addId(col.children);
    }
  }
}

function colspan(col) {
  if (col.children && col.children.length) {
    return col.children.reduce((acc, child) => acc + colspan(child), 0);
  }
  return 1;
}

function offsetLeft(el) {
  if (el.previousElementSibling) {
    return (
      el.previousElementSibling.clientWidth +
      offsetLeft(el.previousElementSibling)
    );
  }
  return 0;
}

function Table(props) {
  const { colsByDepth, deepest } = useMemo(() => {
    addId(props.columns);
    return {
      colsByDepth: groupByDepth(props.columns),
      deepest: findDeepest(props.columns),
    };
  }, [props.columns]);

  function handleSort(col) {
    if (sorter === null || sorter.column !== col) {
      setSorter({ column: col, order: "desc" });
    } else if (sorter.order === "desc") {
      setSorter({ column: col, order: "asc" });
    } else {
      setSorter(null);
    }
  }

  const tableRef = useRef(null);
  const pageCount = 20;
  const [sorter, setSorter] = useState(null);
  const [page, setPage] = useState(1);

  const source = useMemo(() => {
    let result = props.data;
    if (sorter) {
      result = [...props.data].sort((a, b) => {
        return sorter.column.sorter(a, b) * (sorter.order === "asc" ? 1 : -1);
      });
    }
    return result.slice((page - 1) * pageCount, page * pageCount);
  }, [page, sorter, props.data]);

  useEffect(() => {
    Array.from(tableRef.current.querySelectorAll("[data-fixed]")).forEach(
      (td) => {
        if (td.getAttribute("data-fixed") === "left") {
          td.style.left = offsetLeft(td) + "px";
        }
      }
    );
  });

  const totalPage = Math.ceil(props.data.length / pageCount);

  return (
    <div className="p-2 h-full flex flex-col">
      <div
        className="overflow-auto bg-content1 rounded-large shadow-small max-h-max"
        style={{ flex: "1 0 0" }}
      >
        {props.loading ? (
          <Progress isIndeterminate className="w-full" size="sm" />
        ) : null}
        <table className={styles.table} ref={tableRef}>
          <thead>
            {colsByDepth.map((cols, depth) => (
              <tr className="" key={depth}>
                {cols.map((col) => (
                  <th
                    className={`py-2 px-4 ${
                      col.fixed === "left" ? styles["fixed-left"] : ""
                    }`}
                    colSpan={colspan(col)}
                    data-fixed={col.fixed}
                    key={col.id}
                  >
                    <div
                      className={`flex items-center justify-center ${
                        col.sorter ? "cursor-pointer" : ""
                      }`}
                      onClick={() => {
                        if (col.sorter) {
                          handleSort(col);
                        }
                      }}
                    >
                      {col.title}
                      {typeof col.sorter === "function" ? (
                        <svg
                          viewBox="0 0 1024 1024"
                          version="1.1"
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                        >
                          {sorter === null || sorter.column !== col ? (
                            <path
                              d="M448 867.84h-64V276.8l-194.24 194.24-45.44-45.44L448 122.24zM576 873.6V128h64v591.36l194.24-194.24 45.44 45.12z"
                              fill="#000000"
                            ></path>
                          ) : sorter.order === "asc" ? (
                            <path
                              d="M448 867.84h-64V276.8l-194.24 194.24-45.44-45.44L448 122.24z"
                              fill="#000000"
                            ></path>
                          ) : (
                            <path
                              d="M576 873.6V128h64v591.36l194.24-194.24 45.44 45.12z"
                              fill="#000000"
                            ></path>
                          )}
                        </svg>
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {source.map((row, index) => (
              <tr key={row[props.rowKey]} className={index % 2 === 0 ? "" : ""}>
                {deepest.map((col) => (
                  <td
                    className={`py-2 px-4 ${
                      col.fixed === "left" ? styles["fixed-left"] : ""
                    }`}
                    data-fixed={col.fixed}
                    key={col.id}
                  >
                    {col.render?.(col, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPage > 1 ? (
        <div className={`p-2 flex justify-end ${styles.page}`}>
          <Pagination page={page} total={totalPage} onChange={setPage} showControls size="sm" />
        </div>
      ) : null}
    </div>
  );
}

export default memo(Table);
