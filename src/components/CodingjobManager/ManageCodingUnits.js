import db from "apis/dexie";
import SelectionTable from "./SelectionTable";
import React, { useEffect, useRef, useState } from "react";
import { Grid, Table, Header, Dimmer, Loader } from "semantic-ui-react";
import { getColor } from "util/tokenDesign";
import { useSelector } from "react-redux";
import UnitSettings from "./ItemSettings/UnitSettings";
import Document from "components/Tokens/Document";

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
      <Grid stackable columns={5}>
        <Grid.Column verticalAlign="top" stretched width={5}>
          <Header textAlign="center">Settings</Header>

          <UnitSettings codingjob={codingjob} />
        </Grid.Column>

        <Preview codingjob={codingjob} jobItems={jobItems} />
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

const Preview = React.memo(
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
        <Grid.Column width={6}>
          <Header textAlign="center">Unit preview</Header>

          <Dimmer inverted active={jobItem === null}>
            <Loader />
          </Dimmer>
          <Document
            item={jobItem}
            codebook={{ ...codingjob.codebook }}
            settings={previewDocumentSettings}
          />
        </Grid.Column>
      </>
    );
  },
  (p, n) => {
    for (let key of Object.keys(p)) {
      if (p[key] !== n[key]) console.log(key);
    }
  }
);

const ItemDetails = ({ items }) => {
  const mode = useSelector((state) => state.mode);
  const codeMap = useSelector((state) => state.codeMap);

  const docs = {};
  const codes = {};
  for (let item of items) {
    if (!docs[item.docIndex]) docs[item.docIndex] = 0;
    docs[item.docIndex]++;

    if (item.group) {
      if (!codes[item.group]) codes[item.group] = 0;
      codes[item.group]++;
    }
  }
  const data = { docs, codes };

  const totalsTable = () => {
    const totalCodes = () => {
      const n = Object.keys(data.codes).length;
      if (n === 0) return null;
      return (
        <Table.Row>
          <Table.Cell>
            <Header as="h5">unique codes</Header>
          </Table.Cell>
          <Table.Cell>{n}</Table.Cell>
        </Table.Row>
      );
    };

    return (
      <Table basic="very" celled compact>
        <Table.Body>
          <Table.Row>
            <Table.Cell>
              <Header as="h5">total units</Header>
            </Table.Cell>
            <Table.Cell>{items.length}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>
              <Header as="h5">unique documents</Header>
            </Table.Cell>
            <Table.Cell>{Object.keys(data.docs).length}</Table.Cell>
          </Table.Row>
          {totalCodes()}
        </Table.Body>
      </Table>
    );
  };

  const codesTable = () => {
    if (Object.keys(data.codes).length === 0) return null;
    return (
      <Table fixed compact>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell width={13}>code</Table.HeaderCell>
            <Table.HeaderCell>n</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {Object.keys(data.codes).map((code, i) => {
            return (
              <Table.Row key={i} style={{ backgroundColor: getColor(code, codeMap) }}>
                <Table.Cell>{code}</Table.Cell>
                <Table.Cell>{data.codes[code]}</Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    );
  };

  if (mode !== "design") return null;

  const hasCodes = Object.keys(data.codes).length > 0;

  return <div style={{ position: "absolute", bottom: "1em" }}>{codesTable()}</div>;
};

export default React.memo(ManageCodingUnits);
