import React, { useEffect, useState } from "react";

import { Form, Radio, TextArea, Menu, Header, Grid } from "semantic-ui-react";
import { useSelector, useDispatch } from "react-redux";
import { setQuestionIndex } from "actions";

import Help from "components/Help";
import CodeBookEditor from "components/CodeBook/CodeBookEditor";
import { standardizeCodes } from "util/codebook";

const questionDefaultSettings = {
  name: "Question name",
  type: "select code",
  question: "[Enter the question to the coder here...]",
  codes: ["Some", "example", "options"],
};

const QuestionTaskSettings = ({ taskSettings, setTaskSettings, unitSettings }) => {
  // question index via redux, so that it can be linked with question index in the question task preview
  const questionIndex = useSelector((state) => state.questionIndex);
  const dispatch = useDispatch();

  const onAdd = () => {
    const questions = taskSettings.questions;
    questions.push(questionDefaultSettings);
    setTaskSettings({ ...taskSettings, questions });
  };

  const questionMap = () => {
    return taskSettings.questions.map((question, i) => {
      const setQuestionForm = (value) => {
        const newTaskSettings = { ...taskSettings };
        newTaskSettings.questions[i] = value;
        setTaskSettings(newTaskSettings);
      };
      return (
        <QuestionFormSettings
          questionForm={question}
          setQuestionForm={setQuestionForm}
          unitSettings={unitSettings}
        />
      );
    });
  };

  const questionMenu = () => {
    const qlist = questionMap();
    //if (qlist.length === 0) return null;
    return (
      <Grid>
        <Grid.Column width={3}>
          <br />
          <Menu vertical style={{ width: "3em" }}>
            {Array(taskSettings.questions.length)
              .fill(0)
              .map((v, i) => {
                return (
                  <Menu.Item
                    style={{ paddingLeft: "0.5em", paddingRight: "0.3em" }}
                    name={`Q ${i + 1}`}
                    active={questionIndex === i}
                    onClick={(e, d) => dispatch(setQuestionIndex(i))}
                  />
                );
              })}
            <Menu.Item
              icon="plus"
              style={{ paddingBottom: "2em", background: "lightblue" }}
              onClick={onAdd}
            />
          </Menu>
        </Grid.Column>

        <Grid.Column width={10}>
          <br />
          {qlist.length > 0 ? (
            <Header textAlign="center">{`Question ${questionIndex + 1}`}</Header>
          ) : null}
          {qlist[questionIndex]}
        </Grid.Column>
      </Grid>
    );
  };

  return <>{questionMenu()}</>;
};

const QuestionFormSettings = ({ questionForm, setQuestionForm, unitSelection }) => {
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
    const hasTextRef = questionForm.question.search("\\[text\\]") >= 0;

    if (hasCodeRef && unitSelection.value === "all")
      newWarn.push(
        "Referring to a specific code with [code] is only possible if coding units are annotations"
      );
    if (hasTextRef) {
      if (unitSelection.value === "per annotation" && unitSelection.annotationMix > 0) {
        newWarn.push(
          `Referring to the specific [text] of an annotation is not possible if random units are added to the sample (because picking random words would make no sense... I think). This percentage (currently ${unitSelection.annotationMix}%) can be set in the Unit selection menu.`
        );
      } else {
        if (unitSelection.value === "all")
          newWarn.push(
            "Reffering to the specific [text] of an annotation is only possible if coding units are annotations"
          );
      }
    }

    setWarn(newWarn);
    setDelayed({ name: questionForm.name, question: questionForm.question });
  }, [setDelayed, questionForm, setWarn, unitSelection]);
  console.log(warn);

  const codeBookEditor = () => {
    if (questionForm.type !== "search code" && questionForm.type !== "select code") return null;
    return (
      <CodeBookEditor
        codes={standardizeCodes(questionForm.codes)}
        setCodes={(newCodes) => setQuestionForm({ ...questionForm, codes: newCodes })}
      />
    );
  };

  if (!questionForm) return null;

  return (
    <Form>
      <Form.Group grouped>
        <label>Name</label>
        <Form.Field>
          <TextArea
            rows={1}
            value={delayed.name}
            onChange={(e, d) => setDelayed({ ...delayed, name: d.value })}
          />
        </Form.Field>{" "}
        <label>
          Question
          <Help
            header={"Referring to annotation codes in a question"}
            texts={[
              "If unit selection is based on span annotations, you can also use the tag [code]. This will be replaced by the code label of the annotation",
            ]}
          />
        </label>
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
      </Form.Group>
      <br />
      {codeBookEditor()}
    </Form>
  );
};

export default QuestionTaskSettings;
