import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Button,
  Grid,
  Header,
  Input,
  Loader,
  Pagination,
  Popup,
  Segment,
  Table,
} from "semantic-ui-react";
import { getColor } from "util/tokenDesign";

const ItemSelector = ({ items, setItem }) => {
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [delayedActivePage, setDelayedActivePage] = useState(1);

  const onKeyDown = (e) => {
    if (e.keyCode === 9) {
      e.preventDefault();
      if (e.shiftKey) {
        if (e.repeat) {
          setDelayedActivePage((current) => (current > 1 ? current - 1 : current));
        } else {
          setActivePage((current) => (current > 1 ? current - 1 : current));
        }
      } else {
        if (e.repeat) {
          setDelayedActivePage((current) => (current < items.length ? current + 1 : current));
        } else {
          setActivePage((current) => (current < items.length ? current + 1 : current));
        }
      }
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  });

  useEffect(() => {
    if (!items) return null;
    setActivePage(1);
  }, [items, setItem, setActivePage]);

  useEffect(() => {
    if (!items) return null;
    setItem(items[activePage - 1]);
    setDelayedActivePage(activePage);
  }, [items, setItem, activePage]);

  useEffect(() => {
    if (!items) return null;
    if (activePage === delayedActivePage) {
      setLoading(false);
      return null;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      setActivePage(delayedActivePage);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [activePage, delayedActivePage, items, setLoading]);

  if (!items) return null;

  return (
    <Segment style={{ border: "none", boxShadow: "none", padding: 0, leftMargin: "0px" }}>
      <Loader active={loading} content="" />

      <Input
        style={{ padding: 0, margin: 0 }}
        min={1}
        max={items.length}
        onChange={(e, d) => setDelayedActivePage(d.value)}
        type="range"
        labelPosition="left"
        label={
          <Pagination
            secondary
            activePage={delayedActivePage}
            pageItem={`${delayedActivePage} / ${items.length}`}
            size={"mini"}
            firstItem={null}
            lastItem={null}
            prevItem={"back"}
            nextItem={"next"}
            siblingRange={0}
            boundaryRange={0}
            ellipsisItem={null}
            totalPages={items.length}
            onClick={(e, d) => e.stopPropagation()}
            onPageChange={(e, d) => setActivePage(d.activePage)}
            style={{ fontSize: "9px", border: "none", boxShadow: "none", padding: 0, margin: 0 }}
          ></Pagination>
        }
        value={delayedActivePage}
      />
      <ItemDetails items={items} />
    </Segment>
  );
};

const ItemDetails = ({ items }) => {
  const mode = useSelector((state) => state.mode);
  const codeMap = useSelector((state) => state.codeMap);
  const [data, setData] = useState({ docs: {}, codes: {} });

  const aggregate = () => {
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
    setData({ docs, codes });
  };

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
    <Popup
      position="bottom left"
      onOpen={aggregate}
      trigger={<Button style={{ marginLeft: "0.5em", padding: "0.3em" }}>Details</Button>}
      style={{ minWidth: hasCodes ? "40em" : "20em", overflowY: "auto", maxHeight: "50vh" }}
    >
      <Grid columns={2}>
        <Grid.Column width={hasCodes ? 8 : 16}>{totalsTable()}</Grid.Column>
        <Grid.Column>{codesTable()}</Grid.Column>
      </Grid>
    </Popup>
  );
};

export default React.memo(ItemSelector);
