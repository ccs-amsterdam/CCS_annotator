import React from "react";
import { Grid } from "semantic-ui-react";

import DexieTableManager from "./subcomponents/DexieTableManager";
import db from "apis/dexie";

const tableColumns = [
  { name: "id", width: 4 },
  {
    name: "name",
    width: 12,
  },
];

const CodingjobSelector = ({ setSelectedCodingjob }) => {
  const onDelete = async (id) => {
    const docs = await db.idb.documents.where("job_id").equals(id);
    const ndocs = await docs.count();
    if (ndocs > 0) await docs.delete();
  };

  return (
    <Grid centered stackable columns={1}>
      <Grid.Column width={8}>
        <DexieTableManager
          table="codingjobs"
          itemLabel="codingjob"
          columns={tableColumns}
          setSelected={setSelectedCodingjob}
          onDelete={onDelete}
        />
      </Grid.Column>
    </Grid>
  );
};

export default React.memo(CodingjobSelector);
