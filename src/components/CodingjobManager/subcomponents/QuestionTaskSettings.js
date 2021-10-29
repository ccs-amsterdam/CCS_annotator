import React, { useEffect, useState } from "react";

import { Form, Radio, TextArea, Grid, Dropdown } from "semantic-ui-react";

import Help from "./Help";
import CodesEditor from "./CodesEditor";
import { standardizeCodes } from "util/codebook";
import VariableMenu from "./VariableMenu";

const questionDefaultSettings = {
  type: "select code",
  name: "Question name",
  question: "The question itself",
  codes: ["No", "Skip", "Yes"],
};

const QuestionTaskSettings = ({ taskSettings, setTaskSettings, unitSettings }) => {
  const [questionIndex, setQuestionIndex] = useState(0);

  const setQuestions = (variables) => {
    setTaskSettings({
      ...taskSettings,
      questions: { settings: taskSettings.questions.settings, questions: variables },
    });
  };

  return (
    <VariableMenu
      variables={taskSettings.questions.questions}
      setVariables={setQuestions}
      index={questionIndex}
      setIndex={setQuestionIndex}
      newVariableDefaults={questionDefaultSettings}
    >
      <QuestionForm
        taskSettings={taskSettings}
        setTaskSettings={setTaskSettings}
        unitSettings={unitSettings}
        questionIndex={questionIndex}
      />{" "}
    </VariableMenu>
  );
};

const QuestionForm = ({ taskSettings, setTaskSettings, unitSettings, questionIndex }) => {
  const questions = taskSettings.questions.questions;

  const setQuestionForm = (value) => {
    const newTaskSettings = { ...taskSettings };
    const newValue = { ...value };

    newTaskSettings.questions.questions[questionIndex] = newValue;
    setTaskSettings(newTaskSettings);
  };

  return (
    <QuestionFormSettings
      questionForm={questions[questionIndex]}
      setQuestionForm={setQuestionForm}
      setTaskSettings={setTaskSettings}
      questions={questions}
      questionIndex={questionIndex}
      unitSettings={unitSettings}
    />
  );
};

const QuestionFormSettings = ({ questionForm, setQuestionForm, questions, unitSettings }) => {
  const [delayed, setDelayed] = useState("");
  const [warn, setWarn] = useState([]);

  useEffect(() => {
    if (!delayed) return;
    if (questionForm.question === delayed.question) return;
    const timer = setTimeout(() => {
      // if (questionForm.name !== delayed.name)
      //   updateRelevanceBranching(questionForm.name, delayed.name, setTaskSettings);
      setQuestionForm({ ...questionForm, name: delayed.name, question: delayed.question });
    }, 500);
    return () => clearTimeout(timer);
  }, [delayed, questionForm, setQuestionForm]);

  useEffect(() => {
    let newWarn = [];

    const hasCodeRef = questionForm.question.search("\\[code\\]") >= 0;
    console.log(unitSettings);

    if (hasCodeRef && unitSettings?.unitSelection === "allTextUnits")
      newWarn.push(
        "Referring to a specific code with [code] is only possible if coding units are annotations"
      );

    setWarn(newWarn);
    setDelayed({ name: questionForm.name, question: questionForm.question });
  }, [setDelayed, questionForm, setWarn, unitSettings]);

  const codesEditor = () => {
    //if (questionForm.type !== "search code" && questionForm.type !== "select code") return null;
    return (
      <CodesEditor
        codes={standardizeCodes(questionForm.codes)}
        setCodes={(newCodes) => setQuestionForm({ ...questionForm, codes: newCodes })}
        questions={questions}
      />
    );
  };

  if (!questionForm) return null;
  return (
    <Form>
      <Form.Group grouped>
        <br />
        <label>
          Question
          <Help
            header={"Referring to annotation codes in a question"}
            texts={[
              "If unit selection is based on span annotations, you can also use the tag [code]. This will be replaced by the code label of the annotation",
            ]}
          />
        </label>
        {warn.length > 0 ? <Help type="warn" header="" texts={warn} /> : null}
        <Form.Field>
          <TextArea
            value={delayed.question}
            onChange={(e, d) => setDelayed({ ...delayed, question: d.value })}
          />
        </Form.Field>
      </Form.Group>

      <Form.Group grouped>
        <label>Type of answer</label>
        <Form.Field>
          <Radio
            value="search code"
            label="Select code from search box"
            checked={questionForm.type === "search code"}
            onChange={() => setQuestionForm({ ...questionForm, type: "search code" })}
          />
        </Form.Field>
        <Form.Field>
          <Radio
            value="select code"
            label="Select code from buttons"
            checked={questionForm.type === "select code"}
            onChange={() => setQuestionForm({ ...questionForm, type: "select code" })}
          />
        </Form.Field>

        <Form.Field>
          <Radio
            value="annotinder"
            label="Annotinder (swipe left/right/up)"
            checked={questionForm.type === "annotinder"}
            onChange={() => setQuestionForm({ ...questionForm, type: "annotinder" })}
          />
        </Form.Field>
      </Form.Group>
      <br />
      {/* <Form.Group grouped>
        <label>Type of answer</label>
        <Form.Field>
          <Dropdown
            options={questionForm.codes.map((code) => ({ key: code, text: code, value: code }))}
            placeholder="answers that should "
            fluid
            multiple
            selection
          />
        </Form.Field>
      </Form.Group> */}
      <br />
      <AnnotinderEditor questionForm={questionForm} setQuestionForm={setQuestionForm} />
      <div style={{ margin: "-1em" }}>{codesEditor()}</div>
    </Form>
  );
};

const AnnotinderEditor = ({ questionForm, setQuestionForm }) => {
  const [swipes, setSwipes] = useState({ left: null, up: null, right: null });

  useEffect(() => {
    // if there are not yet any .swipe keys, read first 3 codes as defaults
    if (questionForm.type !== "annotinder") return null;
    const newCodes = [...questionForm.codes];
    let firstTime = true;
    for (let code of newCodes) if (code?.swipe) firstTime = false;
    if (!firstTime) return null;
    const directions = ["left", "up", "right"];
    for (let i = 0; i < 3; i++) {
      if (newCodes.length > i) {
        if (typeof newCodes[i] === "object") {
          newCodes[i] = { ...newCodes[i], swipe: directions[i] };
        } else newCodes[i] = { code: newCodes[i], swipe: directions[i] };
      }
    }
    setQuestionForm({ ...questionForm, codes: newCodes });
  }, [questionForm, setQuestionForm]);

  useEffect(() => {
    const getSwipeCode = (direction) => {
      return questionForm.codes.find((code) => {
        if (typeof code !== "object") return false;
        return code.swipe && code.swipe === direction;
      });
    };
    const left = getSwipeCode("left") || null;
    const up = getSwipeCode("up") || null;
    const right = getSwipeCode("right") || null;
    setSwipes({ left, up, right });
  }, [questionForm, setSwipes]);

  const onSelect = (direction, selected) => {
    const newCodes = questionForm.codes.map((code) => {
      const newcode = typeof code !== "object" ? { code } : { ...code };
      if (newcode.code === selected) {
        return { ...newcode, swipe: direction };
      } else {
        if (newcode.swipe && newcode.swipe === direction) return { ...newcode, swipe: null };
      }
      if (!newcode.swipe) newcode.swipe = null;
      return newcode;
    });
    setQuestionForm({ ...questionForm, codes: newCodes });
  };

  if (questionForm.type !== "annotinder") return null;

  const options = questionForm.codes.map((code, i) => {
    return { key: i, text: code.code || code, value: code.code || code };
  });

  return (
    <Form>
      <Grid textAlign="center" verticalAlign="middle">
        <Grid.Row style={{ paddingBottom: "0" }}>
          <Grid.Column width={6}>
            <Form.Group grouped>
              <b>swipe</b> or <b>arrow up</b>
              <br />
              <Dropdown
                placeholder="not used"
                clearable
                value={swipes.up?.code || null}
                options={options}
                selection
                style={{ minWidth: "10em", maxWidth: "10em" }}
                onChange={(e, d) => onSelect("up", d.value)}
              />
            </Form.Group>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={8}>
            <b>swipe</b> or <b>arrow left</b>
            <br />
            <Dropdown
              placeholder="not used"
              clearable
              value={swipes.left?.code || null}
              options={options}
              selection
              style={{ minWidth: "10em", maxWidth: "10em" }}
              onChange={(e, d) => onSelect("left", d.value)}
            />
          </Grid.Column>
          <Grid.Column width={8}>
            <b>swipe</b> or <b>arrow right</b>
            <br />
            <Dropdown
              placeholder="not used"
              clearable
              value={swipes.right?.code || null}
              options={options}
              selection
              style={{ minWidth: "10em", maxWidth: "10em" }}
              onChange={(e, d) => onSelect("right", d.value)}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <br />
      <br />
    </Form>
  );
};

export default QuestionTaskSettings;
