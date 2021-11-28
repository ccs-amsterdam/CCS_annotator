import React, { useEffect, useState } from "react";
import { Grid, Header, Dimmer, Loader } from "semantic-ui-react";

import UnitSettings from "./subcomponents/UnitSettings";
import Document from "components/Document/Document";
import useUnits from "components/CodingjobManager/subcomponents/useUnits";
import { standardizeUnits } from "library/standardizeUnits";
import SampleSettings from "./subcomponents/SampleSettings";
import IndexController from "components/Annotator/subcomponents/IndexController";
import UnitLayoutSettings from "./subcomponents/UnitLayoutSettings";

const ManageCodingUnits = ({ codingjob }) => {
  const units = useUnits(codingjob);

  if (!codingjob) return null;

  return (
    <div>
      <Grid stackable celled="internally" columns={3}>
        <Grid.Column verticalAlign="top" stretched width={6}>
          <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
            Define Coding Units
          </Header>
          <UnitSettings codingjob={codingjob} />
          <br />
          <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
            Coding Unit Layout
          </Header>
          <UnitLayoutSettings codingjob={codingjob} units={units} />
        </Grid.Column>

        <Grid.Column width={4}>
          <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
            Select Units
          </Header>
          <SampleSettings codingjob={codingjob} units={units} />
        </Grid.Column>
        <Grid.Column width={6}>
          <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
            Unit preview
          </Header>
          <PreviewDocument units={units} codingjob={codingjob} codebook={{}} />
        </Grid.Column>
      </Grid>
    </div>
  );
};

const PreviewDocument = ({ units, codingjob, codebook }) => {
  const [unitIndex, setUnitIndex] = useState(null);
  const [standardizedUnit, setStandardizedUnit] = useState(null);

  useEffect(() => {
    if (!units?.[unitIndex]) return null;
    standardizeUnits(codingjob, [units[unitIndex]]).then((singleItemArray) => {
      const previewItem = singleItemArray[0];
      previewItem.post = (annotations) => console.log(annotations); // don't store annotations
      setStandardizedUnit(previewItem);
    });
  }, [units, unitIndex, setStandardizedUnit, codingjob]);

  const renderDocument = () => {
    if (!standardizedUnit) return null;
    return (
      <>
        <Dimmer inverted active={standardizedUnit === null}>
          <Loader />
        </Dimmer>
        <Document unit={standardizedUnit} codes={codebook?.codes} settings={{}} />
      </>
    );
  };

  if (!units?.length > 0) return null;

  return (
    <Grid.Column width={6}>
      <IndexController n={units?.length} index={unitIndex} setIndex={setUnitIndex} />

      {renderDocument()}
    </Grid.Column>
  );
};

export default React.memo(ManageCodingUnits);
