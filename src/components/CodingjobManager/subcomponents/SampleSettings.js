import React, { useEffect, useState } from "react";
import { Icon, Form, Checkbox, Input } from "semantic-ui-react";
import Help from "./Help";
import db from "apis/dexie";
import CheckboxTable from "./CheckboxTable";

const SampleSettings = ({ codingjob, units }) => {
  const unitSettings = codingjob?.unitSettings;
  const setUnitSettings = (us) => {
    db.setCodingjobProp(codingjob, "unitSettings", us);
  };

  if (!unitSettings) return null;
  return (
    <div style={{ verticalAlign: "top", float: "top", paddingLeft: "1em" }}>
      <SampleForm unitSettings={unitSettings} setUnitSettings={setUnitSettings} />
      <SelectValidCodes codingjob={codingjob} units={units} />
    </div>
  );
};

const SampleForm = React.memo(({ unitSettings, setUnitSettings }) => {
  const [delayed, setDelayed] = useState(null); // delayed unitSettings
  const [pct, setPct] = useState(100);
  const totalUnits = unitSettings.totalUnits || 0;

  useEffect(() => {
    setPct(Math.round((100 * unitSettings.n) / totalUnits));
    setDelayed(unitSettings);
  }, [totalUnits, unitSettings, setDelayed]);

  useEffect(() => {
    if (delayed === unitSettings) return null;
    const timer = setTimeout(() => {
      setUnitSettings(delayed);
    }, 300);
    return () => clearTimeout(timer);
  }, [delayed, unitSettings, setUnitSettings]);

  const setWithoutDelay = (field, value) => {
    setUnitSettings({ ...unitSettings, [field]: value });
  };

  // const onChangeMix = (e, d) => {
  //   setDelayed((current) => ({ ...current, annotationMix: Number(d.value) }));
  // };

  const onChangeSeed = (e, d) => {
    setDelayed((current) => ({ ...current, seed: Number(d.value) }));
  };

  const onChangeShuffle = (e, d) => {
    setWithoutDelay("ordered", !d.checked);
  };

  const onChangeBalanceDoc = (e, d) => {
    setWithoutDelay("balanceDocuments", d.checked);
  };
  const onChangeBalanceAnn = (e, d) => {
    setWithoutDelay("balanceAnnotations", d.checked);
  };

  const onChangeN = (e, d) => {
    let value = Number(d.value);
    //value = value > n ? Math.min(totalUnits, value + 4) : Math.max(0, value - 4);
    setPct(Math.round((100 * value) / totalUnits));
    setDelayed((current) => ({ ...current, n: value }));
  };

  const onChangePCT = (e, d) => {
    let value = Number(d.value);
    //value = value > pct ? Math.min(100, value + 4) : Math.max(0, value - 4);
    let valueN = Math.ceil((value / 100) * totalUnits);
    if (valueN >= 0) {
      setPct(value);
      setDelayed((current) => ({ ...current, n: valueN }));
    }
  };

  if (delayed === null) return null;

  return (
    <Form>
      <Form.Group>
        <Icon name="setting" />
        <div>
          <label>Sample settings</label>
          <Help
            header={"Sampling and shuffling"}
            texts={[
              "If % < 100, a random sample will be drawn.",
              "If shuffle is enabled, the order of the units will be randomized.",
              "Seed initializes the random number generator. Simply put, using the same seed gives the same 'random' results if the data is the same.",
            ]}
          />
        </div>

        {/* <Help header={"test"} texts={["test", "this"]} /> */}
      </Form.Group>

      <Form.Group>
        <Form.Field
          width={8}
          min={1}
          max={totalUnits}
          label="N"
          size="mini"
          control={Input}
          type="number"
          value={delayed.n}
          onChange={onChangeN}
        />
        <Form.Field
          width={8}
          min={0}
          step={5}
          max={100}
          label="%"
          size="mini"
          control={Input}
          type="number"
          value={pct}
          onChange={onChangePCT}
        />
      </Form.Group>

      <Form.Group>
        <Form.Field width={8}>
          <label>Shuffle</label>
          <Checkbox toggle size="mini" checked={!unitSettings.ordered} onChange={onChangeShuffle} />
        </Form.Field>

        <Form.Field width={8}>
          <label>Seed</label>
          <Input size="mini" type="number" min={1} value={delayed.seed} onChange={onChangeSeed} />
        </Form.Field>
      </Form.Group>

      <Form.Group grouped widths="equal">
        <Form.Field>
          <b>Balance</b>
          <Help
            header={"Balanced sampling"}
            texts={[
              "Balance sampled Units evenly over groups. Uses a simple approach where unique groups are created (documents, codes, or documentsXcodes), and samples are drawn from these groups one by one",
              "For documents: get an equal number of paragraphs, sentences or annotations per document.",
              "For codes: if units are annotations, get an equal number annotations for each unique code.",
            ]}
          />
        </Form.Field>
        <Form.Field>
          <Checkbox
            size="mini"
            label="documents"
            checked={unitSettings.balanceDocuments}
            onChange={onChangeBalanceDoc}
          />
        </Form.Field>
        <Form.Field>
          <Checkbox
            disabled={unitSettings.unitSelection !== "annotations"}
            size="mini"
            label="codes"
            checked={unitSettings.balanceAnnotations}
            onChange={onChangeBalanceAnn}
          />
        </Form.Field>
      </Form.Group>
      <br />
    </Form>
  );
});

const validCodesColumns = [
  {
    Header: "Code",
    accessor: "code",
    headerClass: "ten wide",
  },
  {
    Header: "N",
    accessor: "N",
    headerClass: "two wide",
  },
];

const SelectValidCodes = ({ codingjob, units }) => {
  const annotation = codingjob?.unitSettings?.annotation;
  const validCodes = codingjob?.unitSettings?.validCodes;
  const isAnnotation = codingjob?.unitSettings?.unitSelection === "annotations";
  const [data, setData] = useState([]);

  const setValidCodes = React.useCallback(
    (newValidCodes) => {
      const unitSettings = {
        ...codingjob.unitSettings,
        validCodes: { ...validCodes, [annotation]: newValidCodes },
      };
      db.setCodingjobProp(codingjob, "unitSettings", unitSettings);
    },
    [codingjob, validCodes, annotation]
  );

  useEffect(() => {
    if (!units || units.length === 0 || !validCodes || !annotation || !isAnnotation) return;
    if (!validCodes[annotation]) return;
    if (!units[0].variables) return;

    const valueMap = units.reduce((obj, unit) => {
      const value = Object.values(unit.variables)[0];
      if (!obj[value]) obj[value] = 0;
      obj[value]++;
      return obj;
    }, {});
    setData(validCodes[annotation].map((row) => ({ ...row, N: valueMap[row.code] })));
  }, [validCodes, units, setData, annotation, isAnnotation]);

  useEffect(() => {
    if (!validCodes || !annotation || !isAnnotation) return null;
    if (validCodes[annotation]) return;
    const importedCodes = codingjob.importedCodes?.[annotation];
    if (!importedCodes) return;
    setValidCodes(importedCodes.map((code) => ({ code: code.code, valid: true })));
  }, [codingjob, annotation, isAnnotation, setValidCodes, validCodes]);

  if (!validCodes || !annotation || !isAnnotation) return null;
  if (!validCodes[annotation]) return null;

  return (
    <Form>
      <Form.Group>
        <Icon name="setting" />
        <div>
          <label>Select annotation codes</label>
        </div>
      </Form.Group>

      <CheckboxTable columns={validCodesColumns} data={data} setData={setValidCodes} />
    </Form>
  );
};

export default React.memo(SampleSettings);
