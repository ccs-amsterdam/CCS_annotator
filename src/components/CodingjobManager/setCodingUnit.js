import db from "apis/dexie";
import SelectionTable from "components/CodingJobsPage/SelectionTable";
import React, { useEffect, useRef, useState } from "react";
import { Grid, Table, Header } from "semantic-ui-react";
import { getColor } from "util/tokenDesign";
import { useSelector } from "react-redux";
import UnitSettings from "./ItemSettings/UnitSettings";
import SelectValidCodes from "./ItemSettings/SelectValidCodes";

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

const SetCodingUnit = ({ codingjob }) => {
  const [jobItems, setJobItems] = useState(null);

  // When a new codingjob is loaded, set codingjobLoaded ref to false
  // this prevents actually loading the data until unitSettings has loaded
  // the unitSettings stored in the codingjob
  const codingjobLoaded = useRef(false);

  useEffect(() => {
    codingjobLoaded.current = false;
  }, [codingjob]);

  useEffect(() => {
    if (!codingjob?.unitSettings) return null;
    getJobItems(codingjob, setJobItems);
  }, [codingjob, codingjobLoaded, setJobItems]);

  if (!codingjob) return null;

  return (
    <div style={{ paddingLeft: "1em" }}>
      <Grid stackable columns={5}>
        <Grid.Column stretched width={5}>
          <UnitSettings codingjob={codingjob} codingjobLoaded={codingjobLoaded} />
        </Grid.Column>
        <Grid.Column width={5}>
          <ItemDetails items={jobItems || []} />
          <SelectionTable
            columns={getTableColumns(codingjob?.unitSettings)}
            data={jobItems || []}
            defaultSize={10}
          />
        </Grid.Column>
        <SelectValidCodes codingjob={codingjob} />
      </Grid>
    </div>
  );
};

const getJobItems = async (codingjob, setJobItems) => {
  let [totalItems, items] = await db.getCodingjobItems(codingjob);
  //await db.setCodingjobProp(codingjob, "jobItems", items);
  setJobItems(items);
  if (
    codingjob.unitSettings.n === null ||
    codingjob.unitSettings.n == null ||
    codingjob.unitSettings.totalItems !== totalItems
  ) {
    await db.setCodingjobProp(codingjob, "unitSettings", {
      ...codingjob.unitSettings,
      n: totalItems,
      totalItems,
    });
  }
};

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

  return (
    <Grid columns={2}>
      <Grid.Column width={hasCodes ? 8 : 16}>{totalsTable()}</Grid.Column>
      <Grid.Column>{codesTable()}</Grid.Column>
    </Grid>
  );
};

export default React.memo(SetCodingUnit);
