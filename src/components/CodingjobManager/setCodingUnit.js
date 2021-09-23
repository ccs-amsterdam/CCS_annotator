import React, { useState, useRef, useEffect } from "react";

import { Grid } from "semantic-ui-react";
import ItemSelector from "components/AnnotatePage/ItemSelector";

import db from "apis/dexie";
import UnitSettings, { defaultUnitSettings } from "./ItemSettings/UnitSettings";
import SelectionTable from "components/CodingJobsPage/SelectionTable";

const getTableColumns = (unitSettings) => {
  return [
    {
      Header: "Document ID",
      accessor: "doc_uid",
      headerClass: "five wide",
    },
    {
      Header: unitSettings.textUnit,
      accessor: "unitIndex",
      headerClass: "five wide",
    },
  ];
};
const SetCodingUnit = ({ codingjob }) => {
  const [jobItems, setJobItems] = useState(null);
  const [unitSettings, setUnitSettings] = useState(defaultUnitSettings);
  const totalItems = useRef(0);

  // When a new codingjob is loaded, set codingjobLoaded ref to false
  // this prevents actually loading the data until unitSettings has loaded
  // the unitSettings stored in the codingjob
  const codingjobLoaded = useRef(false);
  useEffect(() => {
    codingjobLoaded.current = false;
  }, [codingjob]);

  useEffect(() => {
    if (!codingjob) return null;
    if (!codingjobLoaded.current) return null;
    setupCodingjob(codingjob, unitSettings, totalItems, setJobItems, setUnitSettings);
  }, [codingjob, unitSettings, totalItems, setJobItems, setUnitSettings]);

  console.log(jobItems);
  if (!codingjob) return null;
  return (
    <div style={{ paddingLeft: "1em" }}>
      <Grid stackable columns={2}>
        <Grid.Column stretched width={8} style={{ height: "calc(100vh - 3em)" }}>
          <UnitSettings
            codingjob={codingjob}
            unitSettings={unitSettings}
            setUnitSettings={setUnitSettings}
            totalItems={totalItems}
            codingjobLoaded={codingjobLoaded}
          />
        </Grid.Column>
        <Grid.Column width={8}>
          <SelectionTable
            columns={getTableColumns(unitSettings)}
            data={jobItems ? jobItems : []}
            defaultSize={15}
          />
        </Grid.Column>
      </Grid>
    </div>
  );
};

const setupCodingjob = async (
  codingjob,
  unitSettings,
  totalItems,
  setJobItems,
  setUnitSettings
) => {
  let items;
  [totalItems.current, items] = await db.getCodingjobItems(
    codingjob,
    unitSettings.textUnit,
    unitSettings
  );
  setJobItems(items);
  if (unitSettings.n === null || unitSettings.n == null) {
    setUnitSettings((current) => ({ ...current, n: totalItems.current }));
  }
};

export default React.memo(SetCodingUnit);
