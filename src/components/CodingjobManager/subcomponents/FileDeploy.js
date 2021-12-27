import React, { useState, useEffect } from "react";

import { Button, Form } from "semantic-ui-react";
import { saveAs } from "file-saver";
import JSZip from "jszip";

import { drawRandom } from "library/sample";

const FileDeploy = ({ codingjobPackage }) => {
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (codingjobPackage?.title) setTitle(codingjobPackage.title);
  }, [codingjobPackage]);

  const onDownload = async () => {
    const cjSets = createCoderSets(codingjobPackage);

    const zip = new JSZip();
    zip.file(`AmCAT_annotator_${title}.json`, JSON.stringify(codingjobPackage));
    for (let i = 0; i < cjSets.length; i++) {
      const fname = `set_${cjSets[i].set}_units_${cjSets[i].units.length}_${title}.json`;
      zip.file(fname, JSON.stringify(cjSets[i]));
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `AmCAT_annotator_${title}.zip`);
  };

  return (
    <div>
      <Form onSubmit={() => onDownload()}>
        <Form.Input
          placeholder="username"
          value={title}
          maxLength={30}
          onChange={(e, d) => setTitle(d.value)}
          autoFocus
          style={{ width: "100%" }}
        />
      </Form>
      <br />

      <Button
        primary
        fluid
        loading={codingjobPackage === null}
        disabled={title.length < 5}
        onClick={onDownload}
      >
        {title.length < 5 ? "please use 5 characters or more" : "Download codingjob files"}{" "}
      </Button>
    </div>
  );
};

const createCoderSets = (codingjobPackage) => {
  const unitSettings = codingjobPackage.provenance.unitSettings;
  const deploySettings = codingjobPackage.provenance.deploySettings;
  let units = codingjobPackage.units.map((u) => u.unit); // remove unit data for backend (like 'gold')

  if (unitSettings.nCoders === 1)
    return [{ set: 1, title: codingjobPackage.title, codebook: codingjobPackage.codebook, units }];

  const nOverlap = Math.round((unitSettings.totalUnits * deploySettings.pctOverlap) / 100);
  //const n = totalSet - overlapSet

  units = drawRandom(units, units.length, false, 42, null);
  const overlapSet = units.slice(0, nOverlap);
  const unitSet = units.slice(nOverlap);

  let unitSets = Array(Number(deploySettings.nCoders))
    .fill([])
    .map((set) => [...overlapSet]);
  for (let i = 0; i < unitSet.length; i++) {
    unitSets[i % unitSets.length].push(unitSet[i]);
  }

  return unitSets.map((us, i) => ({
    set: i + 1,
    title: codingjobPackage.title,
    codebook: codingjobPackage.codebook,
    units: drawRandom(us, us.length, false, 42, null),
  }));
};

export default FileDeploy;
