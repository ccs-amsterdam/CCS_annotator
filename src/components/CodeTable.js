import React, { useEffect, useState } from "react";
import { Grid, Header, Table } from "semantic-ui-react";
import { useSelector } from "react-redux";
import { randomColor } from "randomcolor";

const CodeBook = () => {
  const codingjob = useSelector((state) => state.codingjob);
  const [codeTree, setCodeTree] = useState([]);

  useEffect(() => {
    if (!codingjob) return null;
    if (!codingjob.codebook) {
      setCodeTree([]);
      return null;
    }
    const cb = JSON.parse(codingjob.codebook);
    if (cb && cb.codes) {
      setCodeTree(codelistToTree(cb.codes));
    }
  }, [codingjob]);

  if (!codingjob) return null;

  return (
    <Grid>
      <Grid.Column width={10}></Grid.Column>
      <Grid.Column width={6} style={{ display: "block", overflow: "auto", height: "90vh" }}>
        <Header as="h4" textAlign="center">
          Codes
        </Header>

        <CodeTreeTable codeTree={codeTree} />
      </Grid.Column>
    </Grid>
  );
};

const CodeTreeTable = ({ codeTree }) => {
  if (!codeTree) return null;
  console.log(codeTree);
  return (
    <Table basic="very" compact>
      <Table.Body>{codeTreeTableBody(codeTree)}</Table.Body>
    </Table>
  );
};

const codeTreeTableBody = (codeTree) => {
  const rows = [];
  codeTreeTableRows(codeTree, 0, rows, []);
  return rows;
};

const codeTreeTableRows = (codeTree, level, rows, colorTrail) => {
  for (const code of Object.keys(codeTree)) {
    let newColorTrail = [...colorTrail];
    newColorTrail.push(randomColor({ seed: code, luminosity: "light" }));
    rows.push(
      <Table.Row key={rows.length}>
        <Table.Cell>
          {colorTrailSpan(newColorTrail)}
          <span style={{}}>{code}</span>
        </Table.Cell>
      </Table.Row>
    );
    if (codeTree[code].children) {
      codeTreeTableRows(codeTree[code].children, 1, rows, newColorTrail);
    }
  }
};

const colorTrailSpan = (colorTrail) => {
  const color = colorTrail[colorTrail.length - 1];
  return (
    <span
      style={{
        display: "inline-block",
        marginLeft: `${1 * colorTrail.length - 1}em`,
        marginRight: "0.5em",
        height: "1em",
        width: "1em",
        background: color,
        border: "1px solid black",
      }}
    ></span>
  );
};

const codelistToTree = (codes) => {
  let parents = codes.reduce((roots, code) => {
    if (!code.parent || code.parent === "") roots[code.code] = { children: {} };
    return roots;
  }, {});

  let parentsDict = codes.reduce((dict, code) => {
    dict[code.code] = code.parent;
    return dict;
  }, {});

  return fillTree(parents, parentsDict);
};

const fillTree = (parents, parentsDict) => {
  const keys = Object.keys(parents);
  if (keys.length === 0) return {};

  for (const code of Object.keys(parentsDict)) {
    if (parents[parentsDict[code]]) {
      parents[parentsDict[code]].children[code] = {};
      delete parentsDict[code];
    }
  }

  for (const key of keys) parents[key] = fillTree(parents[key], parentsDict);
  return parents;
};

export default CodeBook;
