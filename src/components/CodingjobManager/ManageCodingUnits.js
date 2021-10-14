import SelectionTable from "./SelectionTable";
import React, { useEffect, useState } from "react";
import { Grid, Header, Dimmer, Loader } from "semantic-ui-react";

import UnitSettings from "./Settings/UnitSettings";
import Document from "components/Document/Document";
import useItemBundle from "hooks/useItemBundle";
import useJobItems from "hooks/useJobItems";
import { standardizeItems } from "util/standardizeItem";

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
  centerVertical: false,
  showAnnotations: false,
  canAnnotate: true,
  saveAnnotations: false,
};

const ManageCodingUnits = ({ codingjob }) => {
  const jobItems = useJobItems(codingjob);

  if (!codingjob) return null;

  return (
    <div>
      <Grid stackable celled="internally" columns={3}>
        <Grid.Column verticalAlign="top" stretched width={6}>
          <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
            Settings
          </Header>

          <UnitSettings codingjob={codingjob} />
        </Grid.Column>

        <PreviewUnits codingjob={codingjob} jobItems={jobItems} />
      </Grid>
    </div>
  );
};

const PreviewUnits = React.memo(({ codingjob, jobItems }) => {
  const [jobItem, setJobItem] = useState(null);
  const [standardizedItem, setStandardizedItem] = useState(null);

  useEffect(() => {
    if (!jobItem) return null;
    standardizeItems(codingjob, [jobItem]).then(singleItemArray => {
      setStandardizedItem(singleItemArray[0]);
    });
  }, [jobItem, setStandardizedItem, codingjob]);

  useEffect(() => {
    if (jobItems && jobItems.length > 0) {
      setJobItem({ ...jobItems[0], ROW_ID: "0" });
    } else setJobItem(null);
  }, [jobItems, setJobItem]);

  return (
    <>
      <Grid.Column width={5}>
        <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
          Selected units
        </Header>
        <Dimmer inverted active={codingjob?.unitSettings?.textUnit && jobItems === null}>
          <Loader />
        </Dimmer>
        <SelectionTable
          columns={getTableColumns(codingjob?.unitSettings)}
          selectedRow={jobItem}
          setSelectedRow={setJobItem}
          data={jobItems || []}
          defaultSize={10}
        />
        {/* <ItemDetails items={jobItems || []} /> */}
      </Grid.Column>
      <Grid.Column width={5}>
        <PreviewDocument item={standardizedItem} codebook={{}} />
      </Grid.Column>
    </>
  );
});

const PreviewDocument = ({ item, codebook }) => {
  //const itemBundle = useItemBundle(item, codebook, previewDocumentSettings);
  console.log(item);

  const renderDocument = () => {
    if (!item) return null;
    return (
      <>
        <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
          Unit preview
        </Header>

        <Dimmer inverted active={item === null}>
          <Loader />
        </Dimmer>
        <Document unit={item} codes={codebook?.codes} settings={{}} />
      </>
    );
  };

  return <Grid.Column width={6}>{renderDocument()}</Grid.Column>;
};

export default React.memo(ManageCodingUnits);
