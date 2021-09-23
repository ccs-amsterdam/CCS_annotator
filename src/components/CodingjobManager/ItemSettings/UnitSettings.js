import React, { useEffect, useState } from "react";
import {
  Label,
  Icon,
  Form,
  Radio,
  Checkbox,
  Button,
  Input,
  Popup,
  Segment,
} from "semantic-ui-react";
import Help from "components/Help";
import db from "apis/dexie";

export const defaultUnitSettings = {
  textUnit: "document",
  value: "all",
  annotationMix: 0,
  n: null,
  seed: 42,
  ordered: true,
  balanceDocuments: false,
  balanceAnnotations: true,
  validCodes: null,
  highlightAnnotation: false,
  update: 0, // just increments when update button is pressed
};

const UnitSettings = ({
  codingjob,
  unitSettings,
  setUnitSettings,
  totalItems,
  codingjobLoaded,
}) => {
  useEffect(() => {
    if (!codingjob) return null;
    codingjobLoaded.current = false;
    getCodingjobUnitSettings(codingjob, setUnitSettings, codingjobLoaded);
  }, [codingjob, setUnitSettings, codingjobLoaded]);

  useEffect(() => {
    if (codingjobLoaded.current) {
      db.setCodingjobProp(codingjob, "unitSettings", unitSettings);
    }
  }, [codingjob, unitSettings, codingjobLoaded]);

  if (!unitSettings) return null;
  return (
    <Segment>
      <UnitForm unitSettings={unitSettings} setUnitSettings={setUnitSettings} />
      <br />
      <br />
      <SampleForm
        totalItems={totalItems.current}
        unitSettings={unitSettings}
        setUnitSettings={setUnitSettings}
      />
    </Segment>
  );
};

const UnitForm = ({ unitSettings, setUnitSettings }) => {
  return (
    <Form>
      <Form.Group>
        <Icon name="setting" />
        <label>Choose coding unit</label>
      </Form.Group>
      <Form.Group grouped widths="equal">
        <label>Text Unit</label>
        <Form.Field>
          <Radio
            value="document"
            label="Documents"
            checked={unitSettings.textUnit === "document"}
            onChange={(e, d) => setUnitSettings({ ...unitSettings, textUnit: "document", n: null })}
          />
        </Form.Field>
        <Form.Field>
          <Radio
            value="paragraph"
            label="Paragraphs"
            checked={unitSettings.textUnit === "paragraph"}
            onChange={(e, d) =>
              setUnitSettings({ ...unitSettings, textUnit: "paragraph", n: null })
            }
          />
        </Form.Field>
        <Form.Field>
          <Radio
            value="sentence"
            label="Sentences"
            checked={unitSettings.textUnit === "sentence"}
            onChange={(e, d) => setUnitSettings({ ...unitSettings, textUnit: "sentence", n: null })}
          />
        </Form.Field>
        <br />
        <Form.Field>
          <label>Coding Unit</label>
          <Radio
            value="all"
            label="All text units"
            checked={unitSettings.value === "all"}
            onChange={(e, d) => setUnitSettings({ ...unitSettings, value: "all", n: null })}
          />
        </Form.Field>
        <Form.Field>
          <Radio
            value="per annotation"
            label="Text units with annotations"
            checked={unitSettings.value === "per annotation"}
            onChange={(e, d) =>
              setUnitSettings({ ...unitSettings, value: "per annotation", n: null })
            }
          />
          <Help
            header={"By annotation"}
            texts={[
              "Select text units based on annotations. Only text units with at least one annotation will be used*, and a text unit can appear multiple times if it has multiple annotations.",
              "The annotation label can also be used in a 'question based' task. This can for instance be used to ask a coder whether [label] occurs in the text unit.",
              "*random units without any annotations can be added in the sample.",
            ]}
          />
        </Form.Field>

        {/* <Form.Field></Form.Field>
        <Checkbox
          disabled={!unitSettings || unitSettings.textUnit !== "annotation"}
          label="highlight annotation"
          checked={unitSettings.highlightAnnotation}
          onChange={(e, d) =>
            setUnitSettings((current) => ({ ...current, highlightAnnotation: d.checked }))
          }
          style={{ marginLeft: "2em" }}
        /> */}
      </Form.Group>
    </Form>
  );
};

const SampleForm = React.memo(({ totalItems, unitSettings, setUnitSettings }) => {
  const [delayed, setDelayed] = useState(null); // delayed unitSettings
  const [pct, setPct] = useState(100);

  useEffect(() => {
    setPct(Math.round((100 * unitSettings.n) / totalItems));
    setDelayed(unitSettings);
  }, [totalItems, unitSettings, setDelayed]);

  useEffect(() => {
    if (delayed === unitSettings) return null;
    const timer = setTimeout(() => {
      setUnitSettings(delayed);
    }, 300);
    return () => clearTimeout(timer);
  }, [delayed, unitSettings, setUnitSettings]);

  const setWithoutDelay = (field, value) => {
    setUnitSettings((current) => ({ ...current, [field]: value }));
  };

  const onChangeMix = (e, d) => {
    setDelayed((current) => ({ ...current, annotationMix: Number(d.value) }));
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
    //value = value > n ? Math.min(totalItems, value + 4) : Math.max(0, value - 4);
    setPct(Math.round((100 * value) / totalItems));
    setDelayed((current) => ({ ...current, n: value }));
  };

  const onChangePCT = (e, d) => {
    let value = Number(d.value);
    //value = value > pct ? Math.min(100, value + 4) : Math.max(0, value - 4);
    let valueN = Math.ceil((value / 100) * totalItems);
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
        <Form.Field width={3}>
          <label>Shuffle</label>
          <Checkbox toggle size="mini" checked={!unitSettings.ordered} onChange={onChangeShuffle} />
        </Form.Field>
        <Form.Field
          width={5}
          min={1}
          max={totalItems}
          label="N"
          size="mini"
          control={Input}
          type="number"
          value={delayed.n}
          onChange={onChangeN}
        />
        <Form.Field
          width={5}
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

        <Form.Field width={5}>
          <label>Seed</label>
          <Input size="mini" type="number" min={1} value={delayed.seed} onChange={onChangeSeed} />
        </Form.Field>
      </Form.Group>

      <Form.Group>
        <Form.Field width={5}>
          <b>Balance</b>
          <Help
            header={"Balanced sampling"}
            texts={[
              "Balance sampled items evenly over groups. Uses a simple approach where unique groups are created (documents, codes, or documentsXcodes), and samples are drawn from these groups one by one",
              "For documents: get an equal number of paragraphs, sentences or annotations per document",
              "For codes: if units are annotations, get an equal number annotations for each unique code. (You can toggle which codes to include in the codebook, see top-right corner)",
            ]}
          />
        </Form.Field>
        <Form.Field width={5}>
          <Checkbox
            size="mini"
            label="documents"
            checked={unitSettings.balanceDocuments}
            onChange={onChangeBalanceDoc}
          />
        </Form.Field>
        <Form.Field>
          <Checkbox
            disabled={unitSettings.value !== "per annotation"}
            size="mini"
            label="codes"
            checked={unitSettings.balanceAnnotations}
            onChange={onChangeBalanceAnn}
          />
        </Form.Field>
      </Form.Group>

      <Form.Group inline>
        <label style={{ color: unitSettings.codingUnit === "annotation" ? "black" : "grey" }}>
          Add random units
        </label>

        <Form.Field width={4}>
          <Input
            disabled={!unitSettings.codingUnit === "annotation"}
            min={0}
            step={10}
            size="mini"
            type="number"
            value={delayed.annotationMix}
            onChange={onChangeMix}
          />
        </Form.Field>
        <div>
          <label style={{ color: unitSettings.codingUnit === "annotation" ? "black" : "grey" }}>
            % of{" "}
            {unitSettings.codingUnit === "annotation" ? "units with annotation" : "annotations"}
          </label>
          <Help
            header={"Add random annotations"}
            texts={[
              "Add random text units, 'annotated' with random codes",
              "The random codes can be usefull in coding question, such as 'does this text contain [label]",
              "If codes are balanced, a balance of all active codes from the codebook is used. If not, it will approximate the distribution of the codes in the actuall annotations in the sample",
            ]}
          />
        </div>
      </Form.Group>
    </Form>
  );
});

const getCodingjobUnitSettings = async (codingjob, setUnitSettings, codingjobLoaded) => {
  const unitSettings = await db.getCodingjobProp(codingjob, "unitSettings");
  codingjobLoaded.current = true;
  console.log(codingjobLoaded.current);
  if (unitSettings) setUnitSettings(unitSettings);
};

export default React.memo(UnitSettings);
