import React, { useState, useEffect, useRef } from "react";
import { Header, Button, Segment } from "semantic-ui-react";
import { SearchBoxDropdown, ButtonSelection, Annotinder } from "./QuestionForms";

const DONE_COLOR = "lightgreen";

const QuestionForm = ({
  unit,
  tokens,
  questions,
  questionIndex,
  setQuestionIndex,
  setUnitIndex,
  swipe,
  blockEvents,
}) => {
  const [answerTransition, setAnswerTransition] = useState();
  const answered = useRef(false); // to prevent answering double (e.g. with swipe events)
  const [annotations, setAnnotations] = useState(null);

  useEffect(() => {
    prepareAnnotations(unit, tokens, questions, setAnnotations, setQuestionIndex);
    answered.current = false;
  }, [unit, tokens, setAnnotations, questions, setQuestionIndex]);

  if (!questions || !unit || !annotations) return null;
  if (!questions?.[questionIndex]) {
    setQuestionIndex(0);
    return null;
  }

  const question = prepareQuestion(unit, questions[questionIndex]);

  const onSelect = (answer) => {
    // write result to IDB/server and skip to next question or next unit
    if (answered.current) return null;
    answered.current = true;

    annotations[questionIndex].value = answer.code;
    unit.annotations = updateAnnotations(annotations[questionIndex], unit.annotations);
    unit.jobServer.postAnnotations(unit.unitId, unit.annotations);

    setAnswerTransition(answer); // show given answer
    setTimeout(() => {
      // wait a little bit, so coder can see their answer and breathe
      setAnswerTransition(null);

      if (answer.branching === "nextUnit") {
        //markSkippedAsIrrelevant(annotations);
        setUnitIndex((state) => state + 1);
        setQuestionIndex(0);
      } else {
        let newQuestionIndex = questionIndex + 1;
        if (answer.branching === "skipOne") newQuestionIndex += 1;
        if (answer.branching === "skipTwo") newQuestionIndex += 2;
        if (answer.branching === "skipThree") newQuestionIndex += 3;

        if (newQuestionIndex >= questions.length) {
          setUnitIndex((state) => state + 1);
          setQuestionIndex(0);
        } else {
          setQuestionIndex(newQuestionIndex);
        }
      }

      answered.current = false;
    }, 250);
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <QuestionIndexStep
        questions={questions}
        questionIndex={questionIndex}
        annotations={annotations}
        setQuestionIndex={setQuestionIndex}
      />

      <div
        style={{
          display: "flex",
          position: "relative",
          flexFlow: "column",
          height: "calc(100% - 30px)",
          width: "100%",
          maxHeight: "100%",
          padding: "1em",
          color: "white",
          backgroundColor: "#1B1C1D",
        }}
      >
        <div style={{ width: "100%", flex: "1 1 auto", paddingBottom: "10px" }}>
          <Header as="h3" style={{ color: "white" }}>
            {question}
          </Header>
        </div>
        <AnswerSegment
          answerTransition={answerTransition}
          currentAnswer={annotations?.[questionIndex]?.value}
          questions={questions}
          questionIndex={questionIndex}
          onSelect={onSelect}
          swipe={swipe}
          blockEvents={blockEvents}
        />
      </div>
    </div>
  );
};

const prepareAnnotations = (unit, tokens, questions, setAnnotations, setQuestionIndex) => {
  // create a list with annotations for each question, and see if they have been answered yet
  if (tokens.length === 0) return null;
  const annotations = [];
  if (!unit.annotations) unit.annotations = [];
  let questionIndex = 0;
  for (let i = 0; i < questions.length; i++) {
    const annotation = createAnnotationObject(tokens, questions[i], i);
    annotation.value = getCurrentAnswer(unit.annotations, annotation);
    if (annotation.value !== null) questionIndex = i;
    annotations.push(annotation);
  }
  setAnnotations(annotations);
  setQuestionIndex(questionIndex);
};

const QuestionIndexStep = ({ questions, questionIndex, annotations, setQuestionIndex }) => {
  //if (questions.length === 1) return null;
  const [canSelect, setCanSelect] = useState();

  useEffect(() => {
    const cs = Array(annotations.length).fill(false);
    cs[0] = true;
    setCanSelect(cs);
  }, [annotations, setCanSelect]);

  useEffect(() => {
    setCanSelect((state) => {
      const newState = [...state];
      newState[questionIndex] = true;
      return newState;
    });
  }, [questionIndex, setCanSelect]);

  const setColor = (i) => {
    if (canSelect && i > questionIndex && !canSelect[i]) return ["white", "grey"];
    if (annotations[i].value) return ["black", DONE_COLOR];
    if (i === 0) return [DONE_COLOR, "#1B1C1D"];
    if (canSelect && canSelect[i]) return [DONE_COLOR, "#1B1C1D"];
    return [DONE_COLOR, "grey"];
  };

  return (
    <div>
      <Button.Group
        fluid
        style={{
          border: "1px solid",
          height: "30px",
        }}
      >
        {questions.map((q, i) => {
          const [color, background] = setColor(i);
          return (
            <Button
              active={i === questionIndex}
              style={{
                padding: "0em 0.2em 0.2em 0.2em",

                minWidth: "2em",
                height: "30px",
                borderRadius: "0",
                fontSize: "12px",
                border: "1px solid darkgrey",
                background: background,
                textOverflow: "clip",
                overflow: "hidden",
                color: color,
              }}
              onClick={() => {
                if (canSelect[i]) {
                  setQuestionIndex(i);
                }
              }}
            >
              {/* {i + 1} */}
              <span title={questions[i].name}>{questions[i].name}</span>
            </Button>
          );
        })}
      </Button.Group>
    </div>
  );
};

const AnswerSegment = ({
  answerTransition,
  currentAnswer,
  questions,
  questionIndex,
  onSelect,
  swipe,
  blockEvents,
}) => {
  if (answerTransition)
    return (
      <Segment
        style={{
          display: "flex",
          flex: "1 1 auto",
          padding: "0",
          overflowY: "auto",
          height: "100%",
          width: "100%",
          margin: "0",
          background: answerTransition.color,

          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Header as="h1">{answerTransition.code}</Header>
      </Segment>
    );
  return (
    <>
      {showCurrent(currentAnswer || answerTransition)}
      <Segment
        style={{
          flex: "1 1 auto",
          padding: "0",
          overflowY: "auto",
          height: "100%",
          width: "100%",
          margin: "0",
        }}
      >
        {questions[questionIndex].type === "search code" ? (
          <SearchBoxDropdown
            options={questions[questionIndex].options}
            callback={onSelect}
            blockEvents={blockEvents}
          />
        ) : null}
        {questions[questionIndex].type === "select code" ? (
          <ButtonSelection
            options={questions[questionIndex].options}
            callback={onSelect}
            blockEvents={blockEvents}
          />
        ) : null}
        {questions[questionIndex].type === "annotinder" ? (
          <Annotinder
            swipeOptions={questions[questionIndex].swipeOptions}
            currentAnswer={currentAnswer}
            callback={onSelect}
            swipe={swipe}
            blockEvents={blockEvents}
          />
        ) : null}
      </Segment>
    </>
  );
};

const createAnnotationObject = (tokens, question, questionIndex) => {
  // creates an object with all information about the annotation except for the
  // value. This lets us check whether the annotations already exists, and add
  // or change the value.
  if (tokens.length === 0) return null;

  const sections = {};
  const lastToken = tokens[tokens.length - 1];

  const charspan = [0, lastToken.offset + lastToken.length];
  const indexspan = [0, tokens.length - 1];
  let [unitStarted, unitEnded] = [false, false];

  let i = 0;
  for (let token of tokens) {
    if (token.codingUnit && !sections[token.section]) sections[token.section] = 1;
    if (!unitStarted && token.codingUnit) {
      unitStarted = true;
      charspan[0] = token.offset;
      indexspan[0] = i;
    }
    if (!unitEnded && !token.codingUnit && unitStarted) {
      unitEnded = true;
      charspan[1] = token.offset - 1;
      indexspan[1] = i - 1;
    }
    i++;
  }

  // make these optional? Because they're not tokenizer agnostic
  const meta = {
    length_tokens: 1 + indexspan[1] - indexspan[0],
    length_paragraphs: 1 + tokens[indexspan[1]].paragraph - tokens[indexspan[0]].paragraph,
    length_sentences: 1 + tokens[indexspan[1]].sentence - tokens[indexspan[0]].sentence,
  };

  return {
    variable: `Q${questionIndex + 1}_${question.name.replace(" ", "_")}`,
    value: null,
    section: Object.keys(sections).join(" + "),
    offset: charspan[0],
    length: charspan[1] - charspan[0],
    meta,
  };
};

const sameQuestion = (x, y) => {
  return (
    x.variable === y.variable &&
    x.section === y.section &&
    x.offset === y.offset &&
    x.length === y.length
  );
};

const getCurrentAnswer = (annotations, annotationObject) => {
  if (!annotations) return null;
  for (let annotation of annotations) {
    if (sameQuestion(annotation, annotationObject)) return annotation.value;
  }
  return null;
};

const updateAnnotations = (newAnnotation, annotations) => {
  if (!annotations) annotations = [];
  for (let i = 0; i < annotations.length; i++) {
    if (sameQuestion(annotations[i], newAnnotation)) {
      annotations[i] = newAnnotation;
      return annotations;
    }
  }
  annotations.push(newAnnotation);
  return annotations;
};

const showCurrent = (currentAnswer) => {
  if (currentAnswer == null) return null;
  return (
    <div style={{ backgroundColor: "white", color: "black" }}>
      <Segment
        style={{
          padding: "0 0 0.5em 0",
          margin: "0",
          borderRadius: "0",
          background: "#1B1C1D",
          color: DONE_COLOR,
          textAlign: "center",
        }}
      >
        <div style={{ marginTop: "0.3em" }}>
          you answered:{"  "}
          <b style={{ fontSize: "1.5em" }}>{`${currentAnswer}`}</b>
        </div>
      </Segment>
    </div>
  );
};

const prepareQuestion = (unit, question) => {
  let preparedQuestion = question.question;

  if (preparedQuestion.search("\\[code\\]") >= 0) {
    if (unit.annotation) {
      let code = unit.annotation.value;
      const codeTag = `{{lightyellow###${code}}}`; // add optional color from itemquestions
      preparedQuestion = preparedQuestion.replace("[code]", codeTag);
    }
  }

  return markedString(preparedQuestion);
};

const markedString = (text) => {
  const regex = new RegExp(/{{(.*?)}}/); // Match text inside two square brackets

  text = text.replace(/(\r\n|\n|\r)/gm, "");
  return (
    <div>
      {text.split(regex).reduce((prev, current, i) => {
        if (i % 2 === 0) {
          prev.push(current);
        } else {
          const [color, string] = current.split("###");
          prev.push(
            <mark key={i + current} style={{ backgroundColor: color }}>
              {string}
            </mark>
          );
        }
        return prev;
      }, [])}
    </div>
  );
};

export default React.memo(QuestionForm);
