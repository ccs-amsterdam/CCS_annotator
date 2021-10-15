import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { Header, Button, Segment } from "semantic-ui-react";
import { setQuestionIndex, setMoveUnitIndex } from "actions";
import { SearchBoxDropdown, ButtonSelection, Annotinder } from "./QuestionForms";

const QuestionForm = ({ unit, tokens, questions, questionIndex, swipe }) => {
  const [answerTransition, setAnswerTransition] = useState();
  const dispatch = useDispatch();
  const answered = useRef(false); // to prevent answering double (e.g. with swipe events)
  const [annotations, setAnnotations] = useState(null);

  useEffect(() => {
    prepareAnnotations(unit, tokens, questions, setAnnotations, dispatch);
    answered.current = false;
  }, [unit, tokens, setAnnotations, questions, dispatch]);

  if (!questions || !unit || !annotations) return null;
  if (!questions?.[questionIndex]) {
    dispatch(setQuestionIndex(0));
    return null;
  }

  const question = prepareQuestion(unit, questions[questionIndex]);

  const onSelect = (answer) => {
    // write result to IDB/server and skip to next question or next unit
    if (answered.current) return null;
    answered.current = true;

    annotations[questionIndex].value = answer.code;
    unit.annotations = updateAnnotations(annotations[questionIndex], unit.annotations);
    unit.post(unit.unitId, unit.annotations);

    setAnswerTransition(answer); // show given answer
    setTimeout(() => {
      // wait a little bit, so coder can confirm their answer
      setAnswerTransition(null);
      if (questionIndex === questions.length - 1) {
        dispatch(setMoveUnitIndex("next"));
        dispatch(setQuestionIndex(0));
      } else {
        dispatch(setQuestionIndex(questionIndex + 1));
      }
      answered.current = false;
    }, 250);
  };

  return (
    <div
      style={{
        display: "flex",
        flexFlow: "column",
        height: "100%",
        width: "100%",
        maxHeight: "100%",
        padding: "1em",
        color: "white",
        borderTop: "5px double grey",
        backgroundColor: "#1B1C1D",
      }}
    >
      <QuestionIndexStep
        questions={questions}
        questionIndex={questionIndex}
        annotations={annotations}
        dispatch={dispatch}
      />
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
      />
    </div>
  );
};

const prepareAnnotations = (unit, tokens, questions, setAnnotations, dispatch) => {
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
  dispatch(setQuestionIndex(questionIndex));
};

const QuestionIndexStep = ({ questions, questionIndex, annotations, dispatch }) => {
  //if (questions.length === 1) return null;
  const setColor = (i) => {
    if (annotations[i].value) return ["black", "yellow"];
    if (i === 0) return ["white", "#1B1C1D"];
    if (i > 0 && annotations[i - 1].value) return ["white", "#1B1C1D"];
    return ["white", "grey"];
  };

  return (
    <Button.Group
      fluid
      style={{
        position: "absolute",
        border: "2px solid black",
        top: "-20px",
        left: "0",
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
              maxWidth: `${100 / questions.length}%`,
              maxHeight: "30px",
              borderRadius: "0",
              fontSize: "12px",
              border: "1px solid darkgrey",
              background: background,
              textOverflow: "clip",
              overflow: "hidden",
              color: color,
            }}
            onClick={() => {
              if (annotations[i].value !== null) {
                dispatch(setQuestionIndex(i));
              }
            }}
          >
            {/* {i + 1} */}
            <span title={questions[i].name}>{questions[i].name}</span>
          </Button>
        );
      })}
    </Button.Group>
  );
};

const AnswerSegment = ({
  answerTransition,
  currentAnswer,
  questions,
  questionIndex,
  onSelect,
  swipe,
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
          <SearchBoxDropdown options={questions[questionIndex].options} callback={onSelect} />
        ) : null}
        {questions[questionIndex].type === "select code" ? (
          <ButtonSelection options={questions[questionIndex].options} callback={onSelect} />
        ) : null}
        {questions[questionIndex].type === "annotinder" ? (
          <Annotinder
            swipeOptions={questions[questionIndex].swipeOptions}
            currentAnswer={currentAnswer}
            callback={onSelect}
            swipe={swipe}
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
  const indexspan = [0, tokens.length];
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
      charspan[1] = token.offset + token.length;
      indexspan[1] = i;
    }
    i++;
  }

  const extras = {};
  // make these optional? Because they're not tokenizer agnostic
  // also only make sense if text_units include all offsets
  // maybe only include IF the offsets are set, OR if offset === 0
  extras.token_start = tokens[0].index;
  extras.token_end = tokens[1].index;
  extras.paragraph_start = tokens[0].paragraph;
  extras.paragraph_end = tokens[1].paragraph;
  extras.sentence_start = tokens[0].sentence;
  extras.sentence_end = tokens[1].sentence;

  return {
    variable: `${questionIndex + 1}: ${question.name}`,
    value: null,
    section: Object.keys(sections).join(" + "),
    offset: charspan[0],
    length: charspan[1] - charspan[0],
    ...extras,
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
    console.log(annotation);
    console.log(annotationObject);
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
          padding: "0.2em",
          margin: "0",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "1.5em", marginTop: "0.3em" }}>
          you answered <b>{`${currentAnswer}`}</b>
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
