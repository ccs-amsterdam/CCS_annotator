import React, { useState, useEffect } from "react";

import { Icon, Form, Radio, Input } from "semantic-ui-react";

import db from "apis/dexie";

const defaultDeploySettings = {
  medium: null,
  nCoders: 1,
  pctOverlap: 10,
  //coders: [{ pctUnits: 100, pctOverlap: 10 }],
};

const DeploySettings = ({ codingjob }) => {
  const deploySettings = codingjob?.deploySettings || defaultDeploySettings;
  const setDeploySettings = (us) => {
    db.setCodingjobProp(codingjob, "deploySettings", us);
  };

  if (!deploySettings) return null;

  return (
    <div style={{ verticalAlign: "top", float: "top", paddingLeft: "1em" }}>
      <DeployForm
        codingjob={codingjob}
        deploySettings={deploySettings}
        setDeploySettings={setDeploySettings}
      />
    </div>
  );
};

const DeployForm = ({ codingjob, deploySettings, setDeploySettings }) => {
  const [delayed, setDelayed] = useState(null); // delayed unitSettings
  const totalUnits = codingjob?.unitSettings?.totalUnits || 0;

  useEffect(() => {
    setDelayed(deploySettings);
  }, [deploySettings, setDelayed]);

  useEffect(() => {
    if (delayed === deploySettings) return null;
    const timer = setTimeout(() => {
      //const newDelayed = computeCoderShare(delayed);
      setDeploySettings(delayed);
    }, 300);
    return () => clearTimeout(timer);
  }, [delayed, deploySettings, setDeploySettings]);

  const radioButton = (value, label) => {
    return (
      <Form.Field>
        <Radio
          value={value}
          label={label}
          checked={deploySettings.medium === value}
          onChange={(e, d) =>
            setDeploySettings({
              ...deploySettings,
              medium: value,
            })
          }
        />
      </Form.Field>
    );
  };

  const amcatSettings = () => {
    return <div></div>;
  };
  const fileSettings = () => {
    if (deploySettings.medium !== "file") return null;
    return (
      <>
        <br />
        <Form.Group>
          <Icon name="setting" />
          <label>Divide jobs</label>
        </Form.Group>
        <Form.Group>
          <Form.Field width={5}>
            <label>Coders</label>
            <Input
              size="mini"
              type="number"
              min={1}
              value={delayed.nCoders}
              onChange={(e, d) => setDelayed((state) => ({ ...state, nCoders: d.value }))}
            />
          </Form.Field>

          <Form.Field width={7}>
            <label>Overlap</label>
            <Input
              size="mini"
              type="number"
              step={1}
              min={0}
              max={100}
              label="%"
              labelPosition="right"
              value={delayed.pctOverlap}
              onChange={(e, d) => setDelayed((state) => ({ ...state, pctOverlap: d.value }))}
            />
          </Form.Field>

          {/* <Form.Field width={5}>
            <label>Off total units</label>
            <Input
              size="mini"
              type="number"
              step={1}
              min={1}
              max={100}
              label="%"
              labelPosition="right"
              value={delayed.pctOfUnits}
              onChange={(e, d) => setDelayed((state) => ({ ...state, pctOfUnits: d.value }))}
            />
          </Form.Field> */}
          <CoderDistribution totalUnits={totalUnits} settings={delayed} />
        </Form.Group>
      </>
    );
  };

  if (delayed === null) return null;

  return (
    <Form>
      <Form.Group>
        <Icon name="setting" />
        <label>Deploy medium</label>
      </Form.Group>
      <Form.Group grouped widths="equal">
        {radioButton("file", "File")}
        {radioButton("amcat", "AmCAT")}
      </Form.Group>
      {amcatSettings()}
      {fileSettings()}
    </Form>
  );
};

// const computeCoderShare = (settings) => {
//   let coders = settings.coders.slice(0, settings.nCoders);
//   const prevCoders = coders.length;
//   const needCoders = settings.nCoders - prevCoders;

//   for (let i = 0; i < needCoders; i++)
//     coders.push({ pctUnits: 100 / prevCoders, pctOverlap: settings.pctOverlap });

//   const totalPctUnits = coders.reduce((total, coder) => {
//     return (total += coder.pctUnits);
//   }, 0);

//   coders = coders.map((coder) => ({
//     ...coder,
//     pctUnits: (coder.pctUnits = (100 * coder.pctUnits) / totalPctUnits),
//   }));

//   return { ...settings, coders };
// };

const CoderDistribution = ({ totalUnits, settings }) => {
  if (!settings) return null;

  const overlapSet = Math.round((totalUnits * settings.pctOverlap) / 100);
  const unitSet = totalUnits - overlapSet;

  const avgPerCoder = overlapSet + unitSet / settings.nCoders;

  return (
    <p style={{ textAlign: "center", color: "blue" }}>
      Avg. units per coder:{" "}
      <b style={{ fontSize: "1.3em" }}>{Math.round(avgPerCoder * 100) / 100}</b>
    </p>
  );
};

// const CoderTable = ({ totalUnits, settings }) => {
//   console.log(settings);
//   if (!settings.coders) return null;

//   const rows = () => {
//     return settings.coders.map((coder, i) => {
//       return (
//         <Table.Row>
//           <Table.Cell>{i + 1}</Table.Cell>
//           <Table.Cell>{Math.round(coder.pctUnits * 100) / 100}</Table.Cell>
//           <Table.Cell>{Math.ceil((coder.pctUnits / 100) * totalUnits)}</Table.Cell>
//         </Table.Row>
//       );
//     });
//   };

//   return (
//     <Table>
//       <Table.Header>
//         <Table.Row>
//           <Table.HeaderCell>Coder</Table.HeaderCell>
//           <Table.HeaderCell>% units</Table.HeaderCell>
//           <Table.HeaderCell># units</Table.HeaderCell>
//         </Table.Row>
//       </Table.Header>
//       <Table.Body>{rows()}</Table.Body>
//     </Table>
//   );
// };

// Also make an option for the type of deployment
// unitlist: users receive single codingjob json with all units
// unitchain: each unit contains a reference to the next unit

// /**
//  * A custom medium allows any backend to be used that can host codingjob jsons, and
//  * has an address to POST annotations. The form lets the user define where to send the codingjob,
//  * and where to
//  * @returns
//  */
// const CustomMedium = () => {
//   return <div></div>;
// };

export default DeploySettings;
