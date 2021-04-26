import React, { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  clearSpanAnnotations,
  setTokenSelection,
  setCurrentToken,
  clearTokenSelection,
  triggerCodeselector,
} from "../actions";
import { toggleAnnotations } from "../actions";

const arrowkeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

const SpanAnnotations = ({ doc, tokens }) => {
  const currentToken = useSelector((state) => state.currentToken);
  const tokenSelection = useSelector((state) => state.tokenSelection);
  const eventsBlocked = useSelector((state) => state.eventsBlocked);

  const [holdMouseLeft, setHoldMouseLeft] = useState(false);
  const [mover, setMover] = useState(null);
  const [holdCtrl, setHoldCtrl] = useState(false);
  const [holdArrow, setHoldArrow] = useState(null);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(clearSpanAnnotations());
  }, [doc, dispatch]);

  useEffect(() => {
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("contextmenu", onContextMenu);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("contextmenu", onContextMenu);
    };
  });

  // (see useEffect with 'eventsBlocked' for details on useCallback)
  const onKeyUp = useCallback((event) => {
    // keep track of which buttons are pressed in the state
    if (event.key === "Control" || event.key === "Shift") {
      setHoldCtrl(false);
      return;
    }
    if (arrowkeys.includes(event.key)) {
      setHoldArrow(false);
      setMover(null);
    }
  }, []);

  // (see useEffect with 'eventsBlocked' for details on useCallback)
  const onKeyDown = useCallback(
    (event) => {
      // key presses, and key holding (see onKeyUp)
      if (event.key === "Control" || event.key === "Shift") {
        if (event.repeat) return;
        setHoldCtrl(true);
        return;
      }
      if (arrowkeys.includes(event.key)) {
        event.preventDefault();
        if (event.repeat) return;
        setMover({
          position: currentToken,
          startposition: currentToken,
          ntokens: tokens.length,
          counter: 1,
        });
        setHoldArrow(event.key);
      }

      if (tokenSelection.length > 0) {
        const space_enter = event.keyCode === 32 || event.keyCode === 13;
        if (space_enter) {
          event.preventDefault();
          annotationFromSelection(tokens, tokenSelection, dispatch);
        }
      }
    },
    [currentToken, tokenSelection, tokens, dispatch]
  );

  // This blocks event listeners when the eventsBlocked state (in redux) is true.
  // This lets us block the key activities in the text (selecting tokens) when
  // the CodeSelector popup is open
  useEffect(() => {
    if (eventsBlocked) {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      setHoldCtrl(false);
      setHoldArrow(false);
    } else {
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
    }
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [eventsBlocked, onKeyDown, onKeyUp]);

  useEffect(() => {
    // When arrow key is held, walk through tokens with increasing speed
    // this loops itself by updating mover (an object with position information)
    // this is like setIntervall, but allows custom time intervalls,
    // and we can interject the loop with updated keydowns (currently ctrl for starting selection)
    if (!mover || !holdArrow) return;

    let position = movePosition(tokens, holdArrow, mover, holdCtrl, dispatch);

    let delay = Math.max(5, 100 / Math.ceil(mover.counter / 5));
    if (mover.counter === 1) delay = 150;
    setTimeout(() => {
      setMover({
        position: position,
        startposition: mover.startposition,
        ntokens: mover.ntokens,
        counter: mover.counter + 1,
      });
    }, delay);
  }, [tokens, mover, holdArrow, holdCtrl, dispatch]);

  const onMouseDown = (event) => {
    // When left button pressed, start new selection
    if (event.which !== 1) return null;
    event.preventDefault();
    setHoldMouseLeft(true);
    dispatch(clearTokenSelection());
  };

  const onMouseMove = (event) => {
    // When selection started (mousedown), select tokens hovered over
    if (event.which !== 1) return null;
    if (holdMouseLeft) {
      storeMouseSelection(event);
    }
  };

  const onMouseUp = (event) => {
    // When left mouse key is released, create the annotation
    // note that in case of a single click, the token has not been selected (this happens on move)
    // so this way a click can still be used to open
    if (event.which !== 1) return null;
    const currentNode = storeMouseSelection(event);
    const selection = window.getSelection();
    selection.empty();
    setHoldMouseLeft(false);

    // storeMouseSelection does save position to tokenSelection state, but this isn't
    // yet updated within this scope. This results in single clicks (without mousemove)
    // not registering. So if there is no current selection, directly use currentNode as position.
    if (tokenSelection.length > 0) {
      annotationFromSelection(tokens, tokenSelection, dispatch);
    } else {
      if (currentNode !== null)
        annotationFromSelection(tokens, [currentNode, currentNode], dispatch);
    }
  };

  const onContextMenu = (event) => {
    if (event.button === 2) return null;
    event.preventDefault();
    event.stopPropagation();
  };

  const storeMouseSelection = (event) => {
    // select tokens that the mouse/touch is currently pointing at
    let currentNode = getToken(tokens, event.originalTarget);
    if (!currentNode) return null;

    dispatch(setCurrentToken(currentNode.index));
    dispatch(setTokenSelection(currentNode.index, true));
    return currentNode.index;
  };

  if (!doc) return null;

  return <></>;
};

const annotationFromSelection = (tokens, selection, dispatch) => {
  let [from, to] = selection;
  if (from > to) [from, to] = [to, from];

  const annotations = [];
  for (let i = from; i <= to; i++) {
    annotations.push({
      index: i,
      group: "Not yet assigned",
      offset: tokens[from].offset.start,
      length:
        tokens[to].offset.length +
        tokens[to].offset.start -
        tokens[from].offset.start,
      span: [from, to],
    });
  }
  dispatch(toggleAnnotations(annotations));
  dispatch(clearTokenSelection());
  dispatch(triggerCodeselector(null, null));
  dispatch(triggerCodeselector("new_selection", to));
};

const movePosition = (tokens, key, mover, ctrl, dispatch) => {
  let newPosition = mover.position;
  if (key === "ArrowRight") newPosition++;
  if (key === "ArrowLeft") newPosition--;
  if (key === "ArrowUp") newPosition = moveSentence(tokens, mover, "up");
  if (key === "ArrowDown") newPosition = moveSentence(tokens, mover, "down");

  if (newPosition > mover.ntokens) newPosition = mover.ntokens;
  if (newPosition < 0) newPosition = 0;

  if (mover.position !== newPosition) {
    dispatch(setCurrentToken(newPosition));
    dispatch(setTokenSelection(newPosition, ctrl));
  }
  tokens[newPosition].ref.current.scrollIntoView({ block: "center" });
  return newPosition;
};

const moveSentence = (tokens, mover, direction = "up") => {
  // moving sentences is a bit tricky, but we can do it via the refs to the
  // token spans, that provide information about the x and y values
  const current = tokens[mover.position].ref.current.getBoundingClientRect();
  const start = tokens[mover.startposition].ref.current.getBoundingClientRect();
  let next;

  if (direction === "up") {
    for (let i = mover.position; i >= 0; i--) {
      next = tokens[i].ref.current.getBoundingClientRect();
      if (next.y < current.y && next.x < start.x) {
        return i;
      }
    }
    return 0;
  }
  if (direction === "down") {
    for (let i = mover.position; i < tokens.length; i++) {
      next = tokens[i].ref.current.getBoundingClientRect();
      if (next.y > current.y && next.x > start.x) return i;
    }
    return tokens.length - 1;
  }
};

const getTokenAttributes = (tokens, tokenNode) => {
  const tokenindex = parseInt(tokenNode.getAttribute("tokenindex"));

  return {
    index: tokenindex,
    offset: tokens[tokenindex].offset.start,
    length: tokens[tokenindex].offset.length,
  };
};

const getToken = (tokens, e) => {
  try {
    // sometimes e is Restricted, and I have no clue why,
    // nor how to check this in a condition. hence the try clause
    if (e.className === "token" || e.className === "token selected")
      return getTokenAttributes(tokens, e);
    if (e.parentNode) {
      if (
        e.parentNode.className === "token" ||
        e.parentNode.className === "token selected"
      )
        return getTokenAttributes(tokens, e.parentNode);
    }
    return null;
  } catch (e) {
    console.log(e);
    return null;
  }
};

export default SpanAnnotations;
