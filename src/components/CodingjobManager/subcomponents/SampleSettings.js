import React, { useEffect, useState } from "react";
import { Icon, Form, Checkbox, Input, Header, Button } from "semantic-ui-react";
import Help from "./Help";
import db from "apis/dexie";
import FullDataTable from "./FullDataTable";

const SampleSettings = ({ codingjob, units }) => {
  const unitSettings = codingjob?.unitSettings;
  const setUnitSettings = (us) => {
    db.setCodingjobProp(codingjob, "unitSettings", us);
  };

  const totalN = () => {
    if (!units) return null;
    if (unitSettings?.annotationMix === 0) return null;
    return <Header>Total units = {units.length}</Header>;
  };

  if (!unitSettings) return null;
  return (
    <div style={{ verticalAlign: "top", float: "top", paddingLeft: "1em" }}>
      <SampleForm unitSettings={unitSettings} setUnitSettings={setUnitSettings} />
      <div style={{ height: "25px" }}>{totalN()}</div>
      <br />
      <SelectValidCodes codingjob={codingjob} units={units} />
    </div>
  );
};

const SampleForm = React.memo(({ unitSettings, setUnitSettings }) => {
  const [delayed, setDelayed] = useState(null); // delayed unitSettings
  const [pct, setPct] = useState(100);
  const totalUnits = unitSettings.totalUnits || 0;

  useEffect(() => {
    const pct = 0.1 * Math.round(1000 * (unitSettings.n / totalUnits));
    setPct(pct !== Math.round(pct) ? pct.toFixed(2) : pct);
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

  const onChangeMix = (e, d) => {
    setDelayed((current) => ({ ...current, annotationMix: Number(d.value) }));
  };
  const onChangeOnlyUnused = (e, d) => {
    setWithoutDelay("onlyUnused", d.checked);
  };

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
              "If shuffle is enabled, the order of the units will be randomized. Shuffle cannot be disabled if random annotations are added",
              "Seed initializes the random number generator. Simply put, using the same seed gives the same 'random' results if the data is the same.",
            ]}
          />
        </div>

        {/* <Help header={"test"} texts={["test", "this"]} /> */}
      </Form.Group>

      <Form.Group widths="equal">
        <Form.Field
          fluid
          min={1}
          max={totalUnits}
          label={<b>N</b>}
          size="mini"
          control={Input}
          type="number"
          value={delayed.n}
          onChange={onChangeN}
        />

        <Form.Field
          fluid
          min={0}
          step={5}
          max={100}
          label={<b>%</b>}
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
          <Checkbox
            toggle
            size="mini"
            checked={
              !unitSettings.ordered ||
              (unitSettings.unitSelection === "annotations" && unitSettings.annotationMix > 0)
            }
            onChange={onChangeShuffle}
          />
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
      <Form.Group>
        <Form.Field
          width={8}
          disabled={
            unitSettings.textUnit === "span" || unitSettings.unitSelection === "allTextUnits"
          }
          min={0}
          step={10}
          max={1000}
          label={
            <b>
              Random annotations (%)
              <Help
                header="Create units with random annotations"
                texts={[
                  `Given units based on imported annotations, this feature adds units to the sample in which this annotation does NOT occur.
                   (This is only possible if units are sentences, paragraphs or documents, because randomly adding spans is a lost cause)`,
                  `In other words, if imported annotations are 'positives', then this adds 'negatives' to the sample. 
                   This is particularly relevant for validation tasks, and when it cannot be taken for granted that all negatives are true negatives.`,
                  `The maximum number of random annotations is the number of unique text units times the number of unique codes.`,
                  `Randomly added annotations can concidentally coincide with actual annotations. This can be prevented with the "only unused" setting.`,
                ]}
              />
            </b>
          }
          size="mini"
          control={Input}
          type="number"
          value={delayed.annotationMix}
          onChange={onChangeMix}
        />

        <Form.Field>
          <label>Only unused </label>

          <Checkbox
            toggle
            disabled={
              unitSettings.textUnit === "span" || unitSettings.unitSelection === "allTextUnits"
            }
            size="mini"
            checked={unitSettings.onlyUnused}
            onChange={onChangeOnlyUnused}
            style={{ paddingTop: "3px" }}
          />
        </Form.Field>
      </Form.Group>
    </Form>
  );
});

const validCodesColumns = [
  { name: "USE", width: 1 },
  { name: "ONLY", width: 2 },
  { name: "code" },
  { name: "N" },
  { name: "random" },
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
    if (!validCodes || !annotation || !isAnnotation) return;
    if (!validCodes[annotation]) return;
    if (!units || units.length === 0) {
      setData(validCodes[annotation].map((row) => ({ code: row.code, N: 0, random: 0 })));
      return;
    }
    if (!units[0].variables) return;

    const valueMap = units.reduce((obj, unit) => {
      const value = Object.values(unit.variables)[0];
      if (!obj[value]) obj[value] = { real: 0, random: 0 };
      if (unit.random) {
        obj[value].random++;
      } else obj[value].real++;
      return obj;
    }, {});
    setData(
      validCodes[annotation].map((row) => ({
        ...row,
        N: valueMap[row.code]?.real,
        random: valueMap[row.code]?.random,
      }))
    );
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

  const dataWithCheckbox = data.map((d, i) => {
    d = { ...d };
    d.USE = (
      <Checkbox
        checked={d.valid}
        onClick={() => {
          data[i].valid = !d.valid;
          setValidCodes([...data]);
        }}
      />
    );
    d.ONLY = (
      <Button
        icon="hand point right"
        style={{ padding: "0", background: "white" }}
        onClick={() => {
          setValidCodes(
            data.map((v, j) => {
              v.valid = j === i;
              return v;
            })
          );
        }}
      />
    );
    return d;
  });

  const useAll = () => {
    setValidCodes(
      data.map((v) => {
        v.valid = true;
        return v;
      })
    );
  };

  return (
    <Form>
      <Form.Group>
        <Icon name="setting" />
        <div>
          <label>Annotations per code</label>
        </div>
      </Form.Group>
      <Button
        primary
        content="use all"
        style={{ padding: "5px", marginBottom: "5px" }}
        onClick={useAll}
      />
      <FullDataTable fullData={dataWithCheckbox} columns={validCodesColumns} />
      {/* <CheckboxTable columns={validCodesColumns} data={data} setData={setValidCodes} /> */}
    </Form>
  );
};

export default React.memo(SampleSettings);
