import React from "react";

import CodingjobSelector from "components/CodingjobManager/CodingjobSelector";

import db from "apis/dexie";

const PickCodingjob = ({ codingjob, setCodingjob }) => {
  return (
    <div style={{ paddingLeft: "1em" }}>
      <CodingjobSelector codingjob={codingjob} setCodingjob={setCodingjob} />
    </div>
  );
};

export default React.memo(PickCodingjob);
