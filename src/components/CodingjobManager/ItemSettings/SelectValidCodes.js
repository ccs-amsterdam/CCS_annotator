import React, { useEffect, useState } from "react";
import { Icon, Form, Radio, Checkbox, Input, Segment, Grid } from "semantic-ui-react";
import Help from "components/Help";
import db from "apis/dexie";
import CodeBook from "components/CodeBook/CodeBook";

const UnitSettings = ({ codingjob }) => {
  if (!codingjob?.unitSettings) return null;
  if (!codingjob.unitSettings.totalItems) return null;
  if (codingjob.unitSettings.textUnit !== "span") return null;

  const unitSettings = codingjob.unitSettings;
  const setUnitSettings = (us) => {
    db.setCodingjobProp(codingjob, "unitSettings", us);
  };

  if (!unitSettings) return null;
  return (
    <Grid.Column width={6}>
      <CodeBook />;
    </Grid.Column>
  );
};

export default React.memo(UnitSettings);
