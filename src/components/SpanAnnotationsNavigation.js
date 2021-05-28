import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  clearSpanAnnotations,
  toggleTokenSelection,
  setCurrentToken,
  clearTokenSelection,
  triggerCodeselector,
} from "../actions";
import { toggleAnnotations } from "../actions";

// This component generates no content, but manages navigation for span level annotations

const arrowkeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

const SpanAnnotationsNavigation = ({ doc, tokens }) => {
  const currentToken = useSelector((state) => state.currentToken);
  const tokenSelection = useSelector((state) => state.tokenSelection);
  const eventsBlocked = useSelector((state) => state.eventsBlocked);

  const [mover, setMover] = useState(null);
  const [HoldSpace, setHoldSpace] = useState(false);
  const [holdArrow, setHoldArrow] = useState(null);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(clearSpanAnnotations());
  }, [doc, dispatch]);

  useEffect(() => {
    if (eventsBlocked) {
      setHoldArrow(false);
      setHoldSpace(false);
    }
  }, [setHoldArrow, setHoldSpace, eventsBlocked]);

  useEffect(() => {
    // When arrow key is held, walk through tokens with increasing speed
    // this loops itself by updating mover (an object with position information)
    // this is like setIntervall, but allows custom time intervalls,
    if (!mover || !holdArrow) return;

    let position = movePosition(tokens, holdArrow, mover, HoldSpace, dispatch);

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
  }, [tokens, mover, holdArrow, HoldSpace, dispatch]);

  if (!doc) return null;

  // this prevents rendering the components that manage the key and mouse events
  if (eventsBlocked) return null;

  return (
    <>
      <KeyEvents
        tokenSelection={tokenSelection}
        currentToken={currentToken}
        tokens={tokens}
        setMover={setMover}
        setHoldSpace={setHoldSpace}
        setHoldArrow={setHoldArrow}
      />
      <MouseEvents tokenSelection={tokenSelection} tokens={tokens} />
    </>
  );
};

const KeyEvents = ({
  tokenSelection,
  currentToken,
  tokens,
  setMover,
  setHoldSpace,
  setHoldArrow,
}) => {
  const dispatch = useDispatch();

  // This blocks event listeners when the eventsBlocked state (in redux) is true.
  // This lets us block the key activities in the text (selecting tokens) when
  // the CodeSelector popup is open
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  });

  // (see useEffect with 'eventsBlocked' for details on useCallback)
  const onKeyUp = (event) => {
    // keep track of which buttons are pressed in the state
    if (event.keyCode === 32 || event.key === "Shift") {
      setHoldSpace(false);
      if (tokenSelection.length > 0) annotationFromSelection(tokens, tokenSelection, dispatch);
      return;
    }
    if (arrowkeys.includes(event.key)) {
      setHoldArrow(false);
      setMover(null);
    }
  };

  // (see useEffect with 'eventsBlocked' for details on useCallback)
  const onKeyDown = (event) => {
    // key presses, and key holding (see onKeyUp)
    if (event.keyCode === 32 || event.key === "Shift") {
      event.preventDefault();
      if (event.repeat) return;
      setHoldSpace(true);
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
      if (tokenSelection[0] === tokenSelection[1]) {
        // enter key
        if (event.keyCode === 13) {
          dispatch(triggerCodeselector("enter_key", tokenSelection[0], null));
        }
      }
    }
  };

  return <></>;
};

const MouseEvents = ({ tokenSelection, tokens }) => {
  const [holdMouseLeft, setHoldMouseLeft] = useState(false);
  const dispatch = useDispatch();

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

  const onMouseDown = (event) => {
    // When left button pressed, start new selection
    if (event.which === 1) {
      //event.preventDefault();
      setHoldMouseLeft(true);
      dispatch(clearTokenSelection());
    }
  };

  const onMouseMove = (event) => {
    // When selection started (mousedown), select tokens hovered over
    if (holdMouseLeft) {
      if (event.which !== 1) return null;
      storeMouseSelection(event);
    } else {
      let currentNode = getToken(tokens, event.originalTarget);
      if (currentNode) {
        dispatch(setCurrentToken(currentNode.index));
        dispatch(toggleTokenSelection(currentNode.index, false));
      }
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

    if (currentNode === null) return null;

    // storeMouseSelection does save position to tokenSelection state, but this isn't
    // yet updated within this scope. This results in single clicks (without mousemove)
    // not registering. So if there is no current selection, directly use currentNode as position.
    if (tokenSelection.length > 0) {
      annotationFromSelection(tokens, tokenSelection, dispatch);
    } else {
      if (currentNode !== null) {
        annotationFromSelection(tokens, [currentNode, currentNode], dispatch);
      }
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
    dispatch(toggleTokenSelection(currentNode.index, true));
    return currentNode.index;
  };

  return <></>;
};

const annotationFromSelection = (tokens, selection, dispatch) => {
  let [from, to] = selection;
  if (from > to) [from, to] = [to, from];

  const annotations = [];
  for (let i = from; i <= to; i++) {
    annotations.push({
      index: i,
      group: "UNASSIGNED",
      offset: tokens[from].offset,
      length: tokens[to].length + tokens[to].offset - tokens[from].offset,
      span: [from, to],
    });
  }
  dispatch(toggleAnnotations(annotations));
  dispatch(clearTokenSelection());
  dispatch(triggerCodeselector(null, null, null));
  dispatch(triggerCodeselector("new_selection", to, null));
};

const movePosition = (tokens, key, mover, space, dispatch) => {
  let newPosition = mover.position;
  if (key === "ArrowRight") newPosition++;
  if (key === "ArrowLeft") newPosition--;
  if (key === "ArrowUp") newPosition = moveSentence(tokens, mover, "up");
  if (key === "ArrowDown") newPosition = moveSentence(tokens, mover, "down");

  if (newPosition > mover.ntokens) newPosition = mover.ntokens;
  if (newPosition < 0) newPosition = 0;

  if (mover.position !== newPosition) {
    dispatch(setCurrentToken(newPosition));
    dispatch(toggleTokenSelection(newPosition, space));

    const down = key === "ArrowRight" || key === "ArrowDown";
    console.log(down);
    tokens[newPosition].ref.current.scrollIntoView(false, {
      block: down ? "start" : "end",
    });
  }
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
      if (next.y < current.y && next.x <= start.x) {
        return i;
      }
    }
    return 0;
  }
  if (direction === "down") {
    let nextsent = null;
    for (let i = mover.position; i < tokens.length; i++) {
      next = tokens[i].ref.current.getBoundingClientRect();
      if (!nextsent && next.y > current.y) nextsent = next.y;
      if (nextsent && next.y > nextsent) return i - 1;
      if (next.y > current.y && next.x >= start.x) return i;
    }
    return tokens.length - 1;
  }
};

const getTokenAttributes = (tokens, tokenNode) => {
  const tokenindex = parseInt(tokenNode.getAttribute("tokenindex"));

  return {
    index: tokenindex,
    offset: tokens[tokenindex].offset,
    length: tokens[tokenindex].length,
  };
};

const getToken = (tokens, e) => {
  try {
    // sometimes e is Restricted, and I have no clue why,
    // nor how to check this in a condition. hence the try clause
    if (e.className === "token" || e.className === "token selected")
      return getTokenAttributes(tokens, e);
    if (e.parentNode) {
      if (e.parentNode.className === "token" || e.parentNode.className === "token selected")
        return getTokenAttributes(tokens, e.parentNode);
    }
    return null;
  } catch (e) {
    return null;
  }
};

export default SpanAnnotationsNavigation;
