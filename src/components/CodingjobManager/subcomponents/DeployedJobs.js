import db from "apis/dexie";
import React, { useState, useEffect } from "react";
import { Button, Grid, Header, Popup } from "semantic-ui-react";
import QRCode from "react-qr-code";
import { useCookies } from "react-cookie";
import newAmcatSession from "apis/amcat";
import DataTable from "./DexieTable";
import FullDataTable from "./FullDataTable";

const dtColumns = [
  { name: "id", width: 1 },
  { name: "title" },
  { name: "url" },
  { name: "created" },
];

const DeployedJobs = () => {
  const [jobKey, setJobKey] = useState(null);

  const linkAndQr = () => {
    if (jobKey == null) return <div style={{ height: "6em" }} />;
    const url =
      "https://ccs-amsterdam.github.io/CCS_annotator_client/#/annotator?url=" + jobKey?.url;
    const qrUrl =
      "https://ccs-amsterdam.github.io/CCS_annotator_client/#/annotator?url=" +
      jobKey?.url.replace(":", "%colon%");
    return (
      <div style={{ height: "6em" }}>
        <h3>
          <a href={url}>Open coding job</a>
        </h3>
        <Popup on="click" hoverable trigger={<Button>Show QR code</Button>}>
          <QRCode value={encodeURI(qrUrl)} size={256} />
        </Popup>
      </div>
    );
  };

  return (
    <Grid centered container>
      <Grid.Row>
        <Grid.Column width={8}>
          <DataTable
            table={"deployedJobs"}
            columns={dtColumns}
            setSelected={setJobKey}
            reverse={true}
          />
        </Grid.Column>
        <Grid.Column width={8}>
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

const rtColumns = [
  { name: "document_id" },
  { name: "unit_id" },
  { name: "coder" },
  { name: "variable" },
  { name: "value" },
  { name: "offset" },
  { name: "length" },
  { name: "text" },
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

  return <FullDataTable data={annotations} columns={rtColumns} />;
};

const getResultUrl = async (jobKey, amcat, setAnnotations) => {
  let job = await db.idb.deployedJobs.get({ url: jobKey.url });

  if (!job) return;

  if (!amcat) return;
  try {
    const job_id = jobKey.url.split("/").slice(-1)[0];
    const res = await amcat.getCodingjob(job_id);

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
