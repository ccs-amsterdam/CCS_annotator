import DexieTable from "components/CodingjobManager/subcomponents/DexieTable";
import React from "react";

const tableColumns = [
  { name: "title" },
  { name: "set" },
  { name: "progress", f: (row) => `${row.n_coded || 0} / ${row.units.length}` },
  { name: "last_modified" },
  { name: "id", hide: true },
];

const LocalJobTable = ({ jobKey, setJobKey }) => {
  return (
    <DexieTable
      table={"localJobs"}
      columns={tableColumns}
      setSelected={setJobKey}
      searchOn="title"
    />
  );
};

export default LocalJobTable;
