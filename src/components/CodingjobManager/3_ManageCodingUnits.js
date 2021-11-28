import SelectionTable from "./subcomponents/SelectionTable";
import React, { useEffect, useState } from "react";
import { Grid, Header, Dimmer, Loader } from "semantic-ui-react";

import UnitSettings from "./subcomponents/UnitSettings";
import Document from "components/Document/Document";
import useUnits from "components/CodingjobManager/subcomponents/useUnits";
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
  if (unitSettings.unitSelection === "annotations") {
    columns.push({
      Header: "Span",
      accessor: (row) => {
        if (!row.span) return "";
        return row.span[0] + "-" + row.span[1];
      },
      headerClass: "three wide",
    });
    columns.push({
      Header: `Variables`,
      accessor: (row) => {
        if (!row.variables) return null;
        return Object.keys(row.variables)
          .map((key) => key + ": " + row.variables[key])
          .join(" | ");
      },
      headerClass: "five wide",
    });
  }
  return columns;
};

const ManageCodingUnits = ({ codingjob }) => {
  const units = useUnits(codingjob);
  const [jobItem, setJobItem] = useState(null);

  useEffect(() => {
    if (units && units.length > 0) {
      setJobItem({ ...units[0], ROW_ID: "0" });
    } else setJobItem(null);
  }, [units, setJobItem]);

  if (!codingjob) return null;

  return (
    <div>
      <Grid stackable celled="internally" columns={3}>
        <Grid.Column verticalAlign="top" stretched width={6}>
          <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
            Settings
          </Header>

          <UnitSettings codingjob={codingjob} units={units} />
        </Grid.Column>

        <Grid.Column width={5}>
          <PreviewUnits
            codingjob={codingjob}
            units={units}
            jobItem={jobItem}
            setJobItem={setJobItem}
          />
        </Grid.Column>
        <Grid.Column width={5}>
          <PreviewDocument codingjob={codingjob} jobItem={jobItem} codebook={{}} />
        </Grid.Column>
      </Grid>
    </div>
  );
};

const PreviewUnits = React.memo(({ codingjob, units, jobItem, setJobItem }) => {
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    setColumns(getTableColumns(codingjob?.unitSettings));
  }, [codingjob?.unitSettings]);

  return (
    <>
      <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
        Selected units
      </Header>
      <Dimmer inverted active={codingjob?.unitSettings?.textUnit && units === null}>
        <Loader />
      </Dimmer>
      <SelectionTable
        columns={columns}
        selectedRow={jobItem}
        setSelectedRow={setJobItem}
        data={units || []}
        defaultSize={10}
      />
      {/* <ItemDetails items={units || []} /> */}
    </>
  );
});

const PreviewDocument = ({ codingjob, jobItem, codebook }) => {
  const [standardizedUnit, setStandardizedUnit] = useState(null);

  useEffect(() => {
    if (!jobItem) return null;
    standardizeUnits(codingjob, [jobItem]).then((singleItemArray) => {
      const previewItem = singleItemArray[0];
      previewItem.post = (annotations) => console.log(annotations); // don't store annotations
      setStandardizedUnit(previewItem);
    });
  }, [jobItem, setStandardizedUnit, codingjob]);

  const renderDocument = () => {
    if (!standardizedUnit) return null;
    return (
      <>
        <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
          Unit preview
        </Header>

        <Dimmer inverted active={standardizedUnit === null}>
          <Loader />
        </Dimmer>
        <Document unit={standardizedUnit} codes={codebook?.codes} settings={{}} />
      </>
    );
  };

  return <Grid.Column width={6}>{renderDocument()}</Grid.Column>;
};

export default React.memo(ManageCodingUnits);
