import SelectionTable from "./subcomponents/SelectionTable";
import React, { useEffect, useState } from "react";
import { Grid, Header, Dimmer, Loader } from "semantic-ui-react";

import UnitSettings from "./subcomponents/UnitSettings";
import Document from "components/Document/Document";
import useUnits from "hooks/useUnits";
import { standardizeUnits } from "util/standardizeUnits";

const getTableColumns = (unitSettings) => {
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

const ManageCodingUnits = ({ codingjob }) => {
  const units = useUnits(codingjob);

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

        <PreviewUnits codingjob={codingjob} units={units} />
      </Grid>
    </div>
  );
};

const PreviewUnits = React.memo(({ codingjob, units }) => {
  const [jobItem, setJobItem] = useState(null);
  const [standardizedItem, setStandardizedItem] = useState(null);

  useEffect(() => {
    if (!jobItem) return null;
    standardizeUnits(codingjob, [jobItem]).then((singleItemArray) => {
      const previewItem = singleItemArray[0];
      previewItem.post = (annotations) => console.log(annotations); // don't store annotations
      setStandardizedItem(previewItem);
    });
  }, [jobItem, setStandardizedItem, codingjob]);

  useEffect(() => {
    if (units && units.length > 0) {
      setJobItem({ ...units[0], ROW_ID: "0" });
    } else setJobItem(null);
  }, [units, setJobItem]);

  return (
    <>
      <Grid.Column width={5}>
        <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
          Selected units
        </Header>
        <Dimmer inverted active={codingjob?.unitSettings?.textUnit && units === null}>
          <Loader />
        </Dimmer>
        <SelectionTable
          columns={getTableColumns(codingjob?.unitSettings)}
          selectedRow={jobItem}
          setSelectedRow={setJobItem}
          data={units || []}
          defaultSize={10}
        />
        {/* <ItemDetails items={units || []} /> */}
      </Grid.Column>
      <Grid.Column width={5}>
        <PreviewDocument item={standardizedItem} codebook={{}} />
      </Grid.Column>
    </>
  );
});

const PreviewDocument = ({ item, codebook }) => {
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
