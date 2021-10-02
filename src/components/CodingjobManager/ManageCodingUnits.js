import db from "apis/dexie";
import SelectionTable from "./SelectionTable";
import React, { useEffect, useState } from "react";
import { Grid, Header, Dimmer, Loader } from "semantic-ui-react";

import UnitSettings from "./ItemSettings/UnitSettings";
import Document from "components/Tokens/Document";
import useItemBundle from "hooks/useItemBundle";

const getTableColumns = unitSettings => {
  if (!unitSettings) return [];

  const columns = [
    {
      Header: "Document ID",
      accessor: "document_id",
      headerClass: "five wide",
    },
  ];
  if (unitSettings.textUnit === "paragraph" || unitSettings.textUnit === "sentence") {
    columns.push({
      Header: unitSettings.textUnit,
      accessor: "unitIndex",
      headerClass: "five wide",
    });
  }
  if (unitSettings.textUnit === "span") {
    columns.push({
      Header: "Token",
      accessor: "annotation.index",
      headerClass: "three wide",
    });
    columns.push({
      Header: "Code",
      accessor: "group",
      headerClass: "five wide",
    });
  }
  return columns;
};

const previewDocumentSettings = {
  height: 50,
  textUnitPosition: 1 / 4,
  showAnnotations: false,
  canAnnotate: true,
  saveAnnotations: true,
};

const ManageCodingUnits = ({ codingjob }) => {
  const [jobItems, setJobItems] = useState(null);

  // When a new codingjob is loaded, set codingjobLoaded ref to false
  // this prevents actually loading the data until unitSettings has loaded
  // the unitSettings stored in the codingjob

  useEffect(() => {
    if (!codingjob?.codebook?.unitSettings) return null;
    setJobItems(null);
    getJobItems(codingjob, setJobItems);
  }, [codingjob, setJobItems]);

  if (!codingjob) return null;

  return (
    <div>
      <Grid celled="internally" columns={5}>
        <Grid.Column verticalAlign="top" stretched width={5}>
          <Header textAlign="center">Settings</Header>

          <UnitSettings codingjob={codingjob} />
        </Grid.Column>

        <PreviewUnits codingjob={codingjob} jobItems={jobItems} />
      </Grid>
    </div>
  );
};

const getJobItems = async (codingjob, setJobItems) => {
  let [totalItems, items] = await db.getCodingjobItems(codingjob);
  setJobItems(items);
  if (
    codingjob.codebook.unitSettings.n === null ||
    codingjob.codebook.unitSettings.n == null ||
    codingjob.codebook.unitSettings.totalItems !== totalItems
  ) {
    await db.setCodingjobProp(codingjob, "codebook.unitSettings", {
      ...codingjob.codebook.unitSettings,
      n: totalItems,
      totalItems,
    });
  }
};

const PreviewUnits = React.memo(
  ({ codingjob, jobItems }) => {
    const [jobItem, setJobItem] = useState(null);

    useEffect(() => {
      if (jobItems && jobItems.length > 0) {
        setJobItem({ ...jobItems[0], ROW_ID: "0" });
      } else setJobItem(null);
    }, [jobItems, setJobItem]);

    return (
      <>
        <Grid.Column width={5}>
          <Header textAlign="center">Selected units</Header>
          <Dimmer inverted active={jobItems === null}>
            <Loader />
          </Dimmer>
          <SelectionTable
            columns={getTableColumns(codingjob?.codebook?.unitSettings)}
            selectedRow={jobItem}
            setSelectedRow={setJobItem}
            data={jobItems || []}
            defaultSize={10}
          />
          {/* <ItemDetails items={jobItems || []} /> */}
        </Grid.Column>
        <PreviewDocument item={jobItem} codebook={{ ...codingjob.codebook }} />
      </>
    );
  },
  (p, n) => {
    for (let key of Object.keys(p)) {
      if (p[key] !== n[key]) console.log(key);
    }
  }
);

const PreviewDocument = ({ item, codebook }) => {
  const itemBundle = useItemBundle(item, codebook, previewDocumentSettings);

  const renderDocument = () => {
    if (!item || !itemBundle) return null;
    return (
      <>
        <Header textAlign="center">Unit preview</Header>

        <Dimmer inverted active={item === null}>
          <Loader />
        </Dimmer>
        <Document itemBundle={itemBundle} />
      </>
    );
  };

  return <Grid.Column width={6}>{renderDocument()}</Grid.Column>;
};

export default React.memo(ManageCodingUnits);
