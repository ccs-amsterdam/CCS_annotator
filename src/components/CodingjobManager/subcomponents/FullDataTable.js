import React, { useEffect, useState } from "react";
import PaginationTable from "./PaginationTable";

const PAGESIZE = 10;

/**
 * PaginationTable wrapper for if the full data is already in memory
 */
const FullDataTable = ({ fullData, columns }) => {
  const [data, setData] = useState([]);
  const [pages, setPages] = useState(1);

  const pageChange = (activePage) => {
    const offset = (activePage - 1) * PAGESIZE;
    const newdata = fullData.slice(offset, offset + PAGESIZE);
    setData(newdata);
  };

  useEffect(() => {
    if (!fullData) {
      setData([]);
      return null;
    }
    const n = fullData.length;
    setPages(Math.ceil(n / PAGESIZE));
    let newdata = [];
    if (n > 0) newdata = fullData.slice(0, PAGESIZE);
    setData(newdata);
  }, [fullData]);

  if (!data) return;

  return <PaginationTable data={data} pages={pages} columns={columns} pageChange={pageChange} />;
};

export default FullDataTable;
