import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";

import { Grid } from "semantic-ui-react";

import Annotator from "./Annotator/Annotator";
import ItemSelector from "components/AnnotatePage/ItemSelector";
import ItemSettings, { defaultItemSettings } from "./ItemSettings/ItemSettings";
import ItemBreadcrumb from "./ItemBreadcrumb";
import db from "apis/dexie";

const AnnotatePage = () => {
  const codingjob = useSelector(state => state.codingjob);
  const mode = useSelector(state => state.mode);

  const [itemSettings, setItemSettings] = useState(defaultItemSettings);
  const totalItems = useRef(0);

  const [jobItems, setJobItems] = useState(null);
  const [jobItem, setJobItem] = useState(null);

  // When a new codingjob is loaded, set codingjobLoaded ref to false
  // this prevents actually loading the data until ItemSettings has loaded
  // the itemSettings stored in the codingjob
  const codingjobLoaded = useRef(false);
  useEffect(() => {
    codingjobLoaded.current = false;
  }, [codingjob]);

  useEffect(() => {
    if (!codingjob) return null;
    if (!codingjobLoaded.current) return null;
    setupCodingjob(
      codingjob,
      itemSettings.textUnit,
      itemSettings.unitSelection,
      totalItems,
      setJobItem,
      setJobItems,
      setItemSettings
    );
  }, [
    codingjob,
    itemSettings.textUnit,
    itemSettings.unitSelection,
    totalItems,
    setJobItem,
    setJobItems,
    setItemSettings,
  ]);

  return (
    <div style={{ paddingLeft: "1em", height: "100vh" }}>
      <Grid container stackable>
        <Grid.Row style={{ paddingBottom: "0", maxHeight: "10vh", overflow: "auto" }}>
          <Grid.Column width={8}>
            {mode === "design" ? <ItemBreadcrumb jobItem={jobItem} /> : null}
          </Grid.Column>
          <Grid.Column width={8}>
            <ItemSelector items={jobItems} setItem={setJobItem} />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <ItemSettings
            codingjob={codingjob}
            itemSettings={itemSettings}
            setItemSettings={setItemSettings}
            totalItems={totalItems}
            codingjobLoaded={codingjobLoaded}
          />
        </Grid.Row>
        <Grid.Row style={{ paddingLeft: "1em" }}>
          <Annotator item={jobItem} itemSettings={itemSettings} />
        </Grid.Row>
      </Grid>
    </div>
  );
};

const setupCodingjob = async (
  codingjob,
  textUnit,
  unitSelection,
  totalItems,
  setJobItem,
  setJobItems,
  setItemSettings
) => {
  let items;
  [totalItems.current, items] = await db.getCodingjobItems(codingjob, textUnit, unitSelection);
  setJobItems(items);
  setJobItem(items[0]);
  if (unitSelection.n === null || unitSelection.n == null) {
    setItemSettings(current => {
      const newUnitSelection = { ...unitSelection, n: totalItems.current };
      return { ...current, unitSelection: newUnitSelection };
    });
  }
};

export default React.memo(AnnotatePage);
