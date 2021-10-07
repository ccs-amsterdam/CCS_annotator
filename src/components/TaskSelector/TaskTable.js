import db from "apis/dexie";
import SelectionTable from "components/CodingjobManager/SelectionTable";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect } from "react";

const tableColumns = [
  {
    Header: "Title",
    accessor: "title",
    headerClass: "two wide",
  },
  {
    Header: "URL",
    accessor: "url",
    headerClass: "four wide",
  },
];

const TaskTable = ({ taskKey, setTaskKey }) => {
  const tasks = useLiveQuery(async () => {
    let arr = await db.idb.tasks.orderBy("last_modified").primaryKeys();
    arr = arr.map((a) => ({ title: a[0], url: a[1] }));
    //if (arr) arr.sort((a, b) => b.last_modified - a.last_modified);
    return arr;
  });

  useEffect(() => {
    if (!taskKey && tasks) {
      setTaskKey(tasks.length > 0 ? { ...tasks[0], ROW_ID: "0" } : null);
    }
  }, [taskKey, tasks, setTaskKey]);

  return (
    <SelectionTable
      columns={tableColumns}
      data={tasks ? tasks : []}
      selectedRow={taskKey}
      setSelectedRow={setTaskKey}
      defaultSize={15}
    />
  );
};

export default TaskTable;
