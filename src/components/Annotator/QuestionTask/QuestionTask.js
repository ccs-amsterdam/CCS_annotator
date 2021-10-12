import React, { useState, useEffect, useRef } from "react";
import QuestionForm from "./QuestionForm";
import Document from "components/Document/Document";
import useItemBundle from "hooks/useItemBundle";
import { useSelector } from "react-redux";
import { useSwipeable } from "react-swipeable";
import { codeBookEdgesToMap, getCodeTreeArray } from "util/codebook";

const documentSettings = {
  textUnitPosition: 2 / 4,
  showAnnotations: false,
  centerVertical: true,
  canAnnotate: false,
};

const QuestionTask = ({ item, codebook, preview = false }) => {
  //const [menuHeight, setMenuHeight] = useState(50);
  const questionIndex = useSelector((state) => state.questionIndex);
  const [questions, setQuestions] = useState(null);
  const itemBundle = useItemBundle(item, codebook, documentSettings, preview);
  const refs = { text: useRef(), box: useRef() };
  const [textReady, setTextReady] = useState(0);

  useEffect(() => {
    if (!codebook?.questions) return;
    setQuestions(prepareQuestions(codebook));
  }, [codebook]);

  useEffect(() => {
    if (!refs?.text.current) return null;
    refs.box.current.style.backgroundColor = "white";
    refs.text.current.style.transition = ``;
    refs.box.current.style.transition = ``;
    refs.box.current.style.opacity = 0;
    refs.text.current.style.transform = "translateX(0%) translateY(0%)";
  }, [refs.text, refs.box, item]);

  useEffect(() => {
    if (!refs?.text.current) return null;
    refs.box.current.style.transition = `opacity 200ms ease-out`;
    refs.box.current.style.opacity = 1;
  }, [textReady, refs.text, refs.box]);

  // swipe controlls need to be up here due to working on the div wrapping the while question screen
  // use separate swipe for text (document) and menu rows, to disable swiping up
  // in text (which conflicts with scrolling)
  const [swipe, setSwipe] = useState(null);
  const textSwipe = useSwipeable(swipeControl(questions?.[questionIndex], refs, setSwipe, false));
  const menuSwipe = useSwipeable(swipeControl(questions?.[questionIndex], refs, setSwipe, true));
  //const upSwipe = useSwipeable(swipeControl(questions?.[questionIndex], swipeAnimationRefs.up));

  if (!itemBundle) return null;
  let splitHeight = 50;

  if (codebook.questions[questionIndex].type === "annotinder") {
    splitHeight = 70;
  }

  return (
    <div style={{ height: "100%" }}>
      <div {...textSwipe} style={{ border: "1px solid", height: `${splitHeight}%` }}>
        <div ref={refs.box} style={{ height: "100%", overflow: "hidden" }}>
          <div
            ref={refs.text}
            style={{
              border: "1px solid",
              height: "100%",
              backgroundColor: "white",
              overflow: "hidden",
            }}
          >
            <Document
              tokens={itemBundle?.tokens}
              codebook={itemBundle?.codebook}
              settings={itemBundle?.settings}
              setReady={setTextReady}
            />
          </div>
        </div>
      </div>
      <div {...menuSwipe} style={{ height: `${100 - splitHeight}%` }}>
        <QuestionForm
          itemBundle={itemBundle}
          questions={questions}
          questionIndex={questionIndex}
          preview={preview}
          swipe={swipe}
        />
      </div>
    </div>
  );
};

const prepareQuestions = (codebook) => {
  const questions = codebook.questions;
  return questions.map((question) => {
    const codeMap = codeBookEdgesToMap(question.codes);
    const cta = getCodeTreeArray(codeMap);
    const [options, swipeOptions] = getOptions(cta);
    return { ...question, options, swipeOptions }; // note that it's important that this deep copies question
  });
};

const getOptions = (cta) => {
  const options = [];
  const swipeOptions = {}; // object, for fast lookup in swipeControl

  for (let code of cta) {
    if (!code.active) return options;
    if (!code.activeParent) return options;
    let tree = code.tree.join(" - ");
    //if (tree === "") tree = "Root";
    const option = {
      //ref: React.createRef(),
      code: code.code,
      tree: tree,
      color: code.color,
    };
    if (code.swipe) swipeOptions[code.swipe] = option;
    options.push(option);
  }
  return [options, swipeOptions];
};

const swipeControl = (question, refs, setSwipe, doVertical, triggerdist = 100) => {
  if (!question) return {};
  if (question.type !== "annotinder") return {};
  const transitionTime = 200;
  // const blockSwipe = useRef()

  const swipeConfig = {
    delta: 10, // min distance(px) before a swipe starts. *See Notes*
    preventDefaultTouchmoveEvent: false, // call e.preventDefault *See Details*
    trackTouch: true, // track touch input
    trackMouse: false, // track mouse input
    rotationAngle: 0, // set a rotation angle
  };

  const getDeltas = (d) => {
    let deltaX = d.deltaX;
    let deltaY = d.deltaY;
    if (Math.abs(deltaX) > Math.abs(deltaY) + 10) deltaY = 0;
    if (Math.abs(deltaX) < Math.abs(deltaY) + 10) deltaX = 0;
    if (!doVertical) deltaY = 0;
    return [deltaX, deltaY];
  };

  return {
    onSwiping: (d) => {
      const [deltaX, deltaY] = getDeltas(d);

      refs.text.current.style.transition = ``;
      refs.text.current.style.transform = `translateX(${deltaX}px) translateY(${deltaY}px)`;

      let bgc = question.swipeOptions.up.color;
      if (deltaX > 0) bgc = question.swipeOptions.right.color;
      if (deltaX < 0) bgc = question.swipeOptions.left.color;
      refs.box.current.style.backgroundColor = bgc;
    },
    onSwiped: (d) => {
      const [deltaX, deltaY] = getDeltas(d);

      refs.text.current.style.transition = `transform ${transitionTime}ms ease-out, opacity ${transitionTime}ms ease-out`;

      if (Math.abs(deltaX) < triggerdist && Math.abs(deltaY) < triggerdist) {
        refs.text.current.style.transform = `translateX(0%) translateY(0%)`;
        refs.box.current.style.backgroundColor = "white";
      } else {
        refs.text.current.style.transform = `translateX(${
          deltaX > 0 ? 100 : deltaX < 0 ? -100 : 0
        }%) translateY(${deltaY > 0 ? 100 : -100}%)`;
        refs.box.current.style.transition = `opacity ${transitionTime}ms ease-out`;
        refs.box.current.style.opacity = 0;

        let dir = "up";
        dir = deltaX > 0 ? "right" : "left";
        setSwipe(dir);
        setSwipe(null);
      }
    },
    ...swipeConfig,
  };
};

export default React.memo(QuestionTask);
