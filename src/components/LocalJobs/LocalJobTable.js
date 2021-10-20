import db from "apis/dexie";
import SelectionTable from "components/CodingjobManager/subcomponents/SelectionTable";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect } from "react";

const tableColumns = [
  {
    Header: "Title",
    accessor: "title",
    headerClass: "two wide",
  },
  {
    Header: "Set",
    accessor: "set",
    headerClass: "two wide",
  },
  // note that the progressIndex is the index of the highest fetched unit index, but since this
  // starts at 0, it also represents how many units have been finished
  {
    Header: "progress",
    accessor: "progress",
    headerClass: "two wide",
  },
  {
    Header: "Last modified",
    accessor: "last_modified_str",
    headerClass: "four wide",
  },
];

const LocalJobTable = ({ jobKey, setJobKey }) => {
  const jobs = useLiveQuery(async () => {
    let arr = [];
    await db.idb.localJobs.each((row) => {
      arr.push({
        id: row.id,
        last_modified: row.last_modified,
        last_modified_str: row.last_modified.toString().slice(0, 24),
        set: row.set,
        progress: `${row.progressIndex || 0} / ${row.units.length}`,
        title: row.title,
      });
    });
    arr.sort((a, b) => {
      return b.last_modified - a.last_modified;
    });
    return arr;
  });

  useEffect(() => {
    if (!jobKey && jobs) {
      setJobKey(jobs.length > 0 ? { ...jobs[0], ROW_ID: "0" } : null);
    }
  }, [jobKey, jobs, setJobKey]);

  return (
    <SelectionTable
      columns={tableColumns}
      data={jobs ? jobs : []}
      selectedRow={jobKey}
      setSelectedRow={setJobKey}
      defaultSize={15}
    />
  );
};

export default LocalJobTable;
