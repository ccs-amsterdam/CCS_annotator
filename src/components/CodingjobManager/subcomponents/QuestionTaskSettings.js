import React, { useEffect, useState } from "react";

import {
  Form,
  Radio,
  TextArea,
  Menu,
  Segment,
  Grid,
  Dropdown,
  Button,
  Popup,
  Input,
} from "semantic-ui-react";

import Help from "./Help";
import CodesEditor from "./CodesEditor";
import { standardizeCodes } from "util/codebook";

const questionDefaultSettings = {
  type: "select code",
  name: "Question name",
  question: "The question itself",
  codes: ["No", "Skip", "Yes"],
};

const QuestionTaskSettings = ({ taskSettings, setTaskSettings, unitSettings }) => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const onAdd = () => {
    const questions = taskSettings.questions.questions;
    questions.push(questionDefaultSettings);
    setTaskSettings({ ...taskSettings, questions: { questions } });
  };

  const onDelete = () => {
    const questions = taskSettings.questions.questions;
    const newQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      if (i !== questionIndex) newQuestions.push(questions[i]);
    }

    setTaskSettings({ ...taskSettings, questions: { questions: newQuestions } });
    setDeleteOpen(false);
  };

  const questionMap = () => {
    return taskSettings.questions.questions.map((question, i) => {
      const setQuestionForm = (value) => {
        const newTaskSettings = { ...taskSettings };
        newTaskSettings.questions.questions[i] = value;
        setTaskSettings(newTaskSettings);
      };
      return (
        <QuestionFormSettings
          questionForm={question}
          setQuestionForm={setQuestionForm}
          questionIndex={questionIndex}
          unitSettings={unitSettings}
        />
      );
    });
  };

  const deleteQuestionButton = () => {
    if (taskSettings.questions.questions.length === 0) return null;
    return (
      <Popup
        hoverable
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        trigger={
          <Menu.Item
            icon="minus"
            position="right"
            style={{ background: "red" }}
            onClick={() => setDeleteOpen(!deleteOpen)}
          />
        }
      >
        <p>Delete Question {questionIndex + 1}?</p>

        <Button style={{ background: "red" }} onClick={onDelete}>
          yes please
        </Button>
      </Popup>
    );
  };

  const questionMenu = () => {
    const qlist = questionMap();
    return (
      <div>
        <Menu attached="top">
          {Array(taskSettings.questions.questions.length)
            .fill(0)
            .map((v, i) => {
              return (
                <Menu.Item
                  name={`Q ${i + 1}`}
                  active={questionIndex === i}
                  onClick={(e, d) => setQuestionIndex(i)}
                />
              );
            })}
          <Menu.Item icon="plus" style={{ background: "lightblue" }} onClick={onAdd} />
          {deleteQuestionButton()}
        </Menu>
        <Segment attached="bottom">
          <br />

          {qlist[questionIndex]}
        </Segment>
      </div>
    );
  };

  return <>{questionMenu()}</>;
};

const QuestionFormSettings = ({ questionForm, setQuestionForm, questionIndex, unitSettings }) => {
  const [delayed, setDelayed] = useState("");
  const [warn, setWarn] = useState([]);

  useEffect(() => {
    if (!delayed) return;
    if (questionForm.name === delayed.name && questionForm.question === delayed.question) return;
    const timer = setTimeout(() => {
      setQuestionForm({ ...questionForm, name: delayed.name, question: delayed.question });
    }, 500);
    return () => clearTimeout(timer);
  }, [delayed, questionForm, setQuestionForm]);

  useEffect(() => {
    let newWarn = [];

    const hasCodeRef = questionForm.question.search("\\[code\\]") >= 0;
    console.log(unitSettings);

    if (hasCodeRef && unitSettings?.value === "all")
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
      />
    );
  };

  const variableName = () => {
    if (!delayed?.name) return "";
    return `Q${questionIndex + 1}_${delayed.name.replace(" ", "_")}`;
  };

  if (!questionForm) return null;
  return (
    <Form>
      <Form.Group grouped>
        <label>Name</label> <span style={{ fontSize: "10px" }}>(keep it short)</span>
        <Form.Field>
          <Input
            value={delayed.name}
            style={{ width: "150px" }}
            onChange={(e, d) => setDelayed({ ...delayed, name: d.value })}
          />
          <p style={{ marginLeft: "1em", color: "grey" }}>{`Variable: ${variableName()}`}</p>
        </Form.Field>{" "}
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
      {codesEditor()}
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
