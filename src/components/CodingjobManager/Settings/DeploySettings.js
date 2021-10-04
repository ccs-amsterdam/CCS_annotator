import React from "react";

import { Icon, Form, Radio } from "semantic-ui-react";

import db from "apis/dexie";

const defaultDeploySettings = {
  medium: "file",
};

const DeploySettings = ({ codingjob }) => {
  const deploySettings = codingjob?.codebook?.deploySettings || defaultDeploySettings;
  const setDeploySettings = (us) => {
    db.setCodingjobProp(codingjob, "codebook.deploySettings", us);
  };

  if (!deploySettings) return null;

  return (
    <div style={{ verticalAlign: "top", float: "top", paddingLeft: "1em" }}>
      <DeployForm deploySettings={deploySettings} setDeploySettings={setDeploySettings} />
    </div>
  );
};

const DeployForm = ({ deploySettings, setDeploySettings }) => {
  const radioButton = (value, label) => {
    return (
      <Form.Field>
        <Radio
          value={value}
          label={label}
          disabled={value !== "file"}
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

  return (
    <Form>
      <Form.Group>
        <Icon name="setting" />
        <label>Deploy medium</label>
      </Form.Group>
      <Form.Group grouped widths="equal">
        {radioButton("file", "File")}
        {radioButton("amcat", "AmCAT")}
        {radioButton("custom", "Custom")}
      </Form.Group>
    </Form>
  );
};

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
