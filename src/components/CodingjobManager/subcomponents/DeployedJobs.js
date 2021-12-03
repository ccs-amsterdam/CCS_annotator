import db from "apis/dexie";
import SelectionTable from "./SelectionTable";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useState, useEffect } from "react";
import { useHistory } from "react-router";
import { Button, Grid, Header, Popup, TextArea } from "semantic-ui-react";
import QRCode from "react-qr-code";
import { useCookies } from "react-cookie";
import newAmcatSession from "apis/amcat";

const DeployedJobs = () => {
  const history = useHistory();
  const [jobKey, setJobKey] = useState(null);

  const setJobUrlQuery = async () => {
    // set task.url as url query to open job in annotator
    history.push("/annotator?url=" + jobKey.url);
  };

  const linkAndQr = () => {
    if (jobKey == null) return <div style={{ height: "6em" }} />;
    const url = "https://ccs-amsterdam.github.io/CCS_annotator/#/annotator?url=" + jobKey?.url;
    const qrUrl =
      "https://ccs-amsterdam.github.io/CCS_annotator/#/annotator?url=" +
      jobKey?.url.replace(":", "%colon%");
    return (
      <div style={{ height: "6em" }}>
        <TextArea value={url} style={{ width: "100%", height: "4em", fontSize: "10px" }} />
        <Popup hoverable trigger={<Button>Show QR code</Button>}>
          <QRCode value={encodeURI(qrUrl)} size={256} />
        </Popup>
      </div>
    );
  };

  return (
    <Grid centered container>
      <Grid.Row>
        <Grid.Column width={8}>
          <DeployedTable jobKey={jobKey} setJobKey={setJobKey} />
        </Grid.Column>
        <Grid.Column width={8}>
          <Button primary disabled={!jobKey} onClick={setJobUrlQuery}>
            Open selected codingjob
          </Button>
          <br />
          <br />
          {linkAndQr()}
          <Header>Current annotations</Header>
          <ResultsTable jobKey={jobKey} />
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
};

const deployedTableColumns = [
  {
    Header: "Title",
    accessor: "title",
    headerClass: "two wide",
  },
  {
    Header: "URL",
    accessor: "url",
    headerClass: "four wide",
  },
  {
    Header: "Created",
    accessor: "created",
    headerClass: "four wide",
  },
];

const DeployedTable = ({ jobKey, setJobKey }) => {
  const jobs = useLiveQuery(async () => {
    let arr = await db.idb.deployedJobs.toArray();
    arr.sort((a, b) => {
      return b.created - a.created;
    });

    return arr.map((row) => ({ ...row, created: row.created.toDateString() }));
  });

  useEffect(() => {
    if (!jobKey && jobs) {
      setJobKey(jobs.length > 0 ? { ...jobs[0], ROW_ID: "0" } : null);
    }
  }, [jobKey, jobs, setJobKey]);

  return (
    <SelectionTable
      columns={deployedTableColumns}
      data={jobs ? jobs : []}
      selectedRow={jobKey}
      setSelectedRow={setJobKey}
      defaultSize={15}
    />
  );
};

const resultsTableColumns = [
  {
    Header: "document_id",
    accessor: "document_id",
    headerClass: "three wide",
  },
  {
    Header: "unit_id",
    accessor: "unit_id",
    headerClass: "two wide",
  },
  {
    Header: "Coder",
    accessor: "coder",
    headerClass: "three wide",
  },
  {
    Header: "Variable",
    accessor: "variable",
    headerClass: "three wide",
  },
  {
    Header: "Value",
    accessor: "value",
    headerClass: "three wide",
  },
  {
    Header: "Offset",
    accessor: "offset",
    headerClass: "three wide",
  },
  {
    Header: "Length",
    accessor: "length",
    headerClass: "three wide",
  },
  {
    Header: "Text",
    accessor: "text",
    headerClass: "three wide",
  },
];

const ResultsTable = ({ jobKey }) => {
  const [annotations, setAnnotations] = useState([]);
  const [cookies] = useCookies(["amcat"]);

  useEffect(() => {
    if (!jobKey) return null;
    if (!cookies.amcat) return null;
    const amcat = newAmcatSession(cookies.amcat.host, cookies.amcat.email, cookies.amcat.token);
    setAnnotations([]);
    getResultUrl(jobKey, amcat, setAnnotations);
  }, [jobKey, cookies, setAnnotations]);

  return <SelectionTable columns={resultsTableColumns} data={annotations} />;
};

const getResultUrl = async (jobKey, amcat, setAnnotations) => {
  let job = await db.idb.deployedJobs.get({ url: jobKey.url });

  if (!job) return;

  if (!amcat) return;
  try {
    const res = await amcat.api.get(jobKey.url);
    console.log(res);
    const annotations = res.data.units.reduce((arr, unit, i) => {
      if (unit.annotations) {
        for (let userAnnotations of unit.annotations) {
          const coder = userAnnotations.user;
          const annotations = userAnnotations.annotation;

          for (let ann of annotations) {
            const a = {
              document_id: unit.document_id,
              unit_id: i,
              coder,
              ...unit.provenance,
              ...ann,
            };

            if (unit.meta) {
              for (let key of Object.keys(unit.meta)) {
                a["meta_" + key] = unit.meta[key];
              }
            }

            arr.push(a);
          }
        }
      }
      return arr;
    }, []);
    setAnnotations(annotations);
  } catch (e) {
    console.log(e);
  }
};

export default DeployedJobs;
