import React, { useEffect, useState, useRef } from "react";
import { keepInView } from "library/scroll";
import { moveUp, moveDown } from "library/refNavigation";

// This component generates no content, but manages navigation for span level annotations

const arrowkeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

/**
 * This is a hugely elaborate component for managing navigation (key, mouse and touch events)
 * It doesn't acctually render anything, but its shaped as a component because useEffect is just really convenient here
 * You probably never want to read this. And if you do, don't expect my sympathies. Rather, just blame me
 * if anything in here breaks, or ask nicely if we need more features
 */
export const AnnotationEvents = ({
  tokens,
  currentToken,
  setCurrentToken,
  tokenSelection,
  setTokenSelection,
  triggerCodePopup,
  editMode,
  eventsBlocked,
}) => {
  // !! Keep in mind that positions are based on token.arrayIndex, not token.index
  // arrayIndex is the actual tokens array, where token.index is the position of the token in the document
  // (these can be different if the text/context does not start at token.index 0)

  const [mover, setMover] = useState(null);
  const [HoldSpace, setHoldSpace] = useState(false);
  const [holdArrow, setHoldArrow] = useState(null);

  useEffect(() => {
    if (eventsBlocked) {
      setHoldArrow(false);
      setHoldSpace(false);
    } else {
      setTokenSelection([]);
    }
  }, [setHoldArrow, setHoldSpace, eventsBlocked, setTokenSelection]);

  useEffect(() => {
    // When arrow key is held, walk through tokens with increasing speed
    // this loops itself by updating mover (an object with position information)
    // this is like setIntervall, but allows custom time intervalls,
    if (!mover || !holdArrow || !tokens?.[0]?.containerRef?.current) return;

    let position = movePosition(
      tokens,
      holdArrow,
      mover,
      HoldSpace,
      editMode,
      setCurrentToken,
      setTokenSelection
    );

    let delay;
    if (mover.counter === 1) {
      tokens[0].containerRef.current.style.scrollBehavior = "smooth";
      delay = 150;
    } else {
      tokens[0].containerRef.current.style.scrollBehavior = "auto";
      delay = Math.max(5, 100 / Math.ceil(mover.counter / 5));
    }
    setTimeout(() => {
      setMover({
        position: position,
        startposition: mover.startposition,
        ntokens: mover.ntokens,
        counter: mover.counter + 1,
      });
    }, delay);
  }, [tokens, mover, holdArrow, HoldSpace, setCurrentToken, editMode, setTokenSelection]);

  if (!tokens || tokens.length === 0) return null;

  // this prevents rendering the components that manage the key and mouse events
  if (eventsBlocked) return null;

  return (
    <>
      <KeyEvents
        tokenSelection={tokenSelection}
        currentToken={currentToken}
        tokens={tokens}
        HoldSpace={HoldSpace}
        setMover={setMover}
        setHoldSpace={setHoldSpace}
        setHoldArrow={setHoldArrow}
        triggerCodePopup={triggerCodePopup}
        editMode={editMode}
      />
      <MouseEvents
        tokenSelection={tokenSelection}
        tokens={tokens}
        setCurrentToken={setCurrentToken}
        setTokenSelection={setTokenSelection}
        triggerCodePopup={triggerCodePopup}
        editMode={editMode}
      />
    </>
  );
};

const KeyEvents = ({
  tokenSelection,
  currentToken,
  tokens,
  HoldSpace,
  setMover,
  setHoldSpace,
  setHoldArrow,
  triggerCodePopup,
  editMode,
}) => {
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
    if (event.keyCode === 32 && HoldSpace) {
      setHoldSpace(false);
      if (tokenSelection.length > 0) {
        annotationFromSelection(tokens, tokenSelection, triggerCodePopup);
      }
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
    if (event.keyCode === 32) {
      event.preventDefault();
      if (event.repeat) return;
      setHoldSpace(true);
      return;
    }
    if (arrowkeys.includes(event.key)) {
      event.preventDefault();
      if (event.repeat) return;
      setMover({
        position: currentToken.i,
        startposition: currentToken.i,
        ntokens: tokens.length,
        counter: 1,
      });
      setHoldArrow(event.key);
    }

    // if (tokenSelection.length > 0) {
    //   if (tokenSelection[0] === tokenSelection[1]) {
    //     // enter key
    //     if (event.keyCode === 13) {
    //       triggerCodePopup(tokens[tokenSelection[0]].index, null, null);
    //     }
    //   }
    // }
  };

  return <></>;
};

const MouseEvents = ({
  tokenSelection,
  tokens,
  setCurrentToken,
  setTokenSelection,
  triggerCodePopup,
  editMode,
}) => {
  const selectionStarted = useRef(false);
  const tapped = useRef(null);
  const touch = useRef(null);
  const istouch = useRef(
    "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0
  ); // hack to notice if device uses touch (because single touch somehow triggers mouseup)

  useEffect(() => {
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchstart", onTouchDown);
    window.addEventListener("touchend", onTouchUp);
    window.addEventListener("contextmenu", onContextMenu);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchstart", onTouchDown);
      window.removeEventListener("touchend", onTouchUp);
      window.removeEventListener("contextmenu", onContextMenu);
    };
  });

  const onTouchDown = (event) => {
    // store token from touch down, but process on touch up, so that we cna set a max
    // time passed (to ignore holding touch when scrolling)
    touch.current = { time: new Date(), token: getToken(tokens, event) };
  };

  const onTouchUp = (e) => {
    if (!touch.current?.time) return;
    const now = new Date();
    const timepassed = now - touch.current.time;
    if (timepassed > 150) return;
    const token = touch.current.token;

    if (token?.index === null) {
      rmTapped(tokens, tapped.current);
      tapped.current = null;
      setTokenSelection((state) => (state.length === 0 ? state : []));
      return;
    }

    // first check if there is a tokenselection (after double tab). If so, this completes the selection
    if (tokenSelection.length > 0 && tokenSelection[0] === tapped.current) {
      // if a single token, and an annotation already exists, open create/edit mode
      const currentNode = storeMouseSelection(token);
      setTokenSelection((state) => updateSelection(state, tokens, currentNode, true));

      if (token?.annotated && currentNode === tokenSelection[0]) {
        annotationFromSelection(tokens, [currentNode, currentNode], triggerCodePopup);
      } else {
        annotationFromSelection(tokens, [tokenSelection[0], currentNode], triggerCodePopup);
      }
      rmTapped(tokens, tapped.current);
      tapped.current = null;
      setCurrentToken({ i: null });
      return;
    }

    // otherwise, handle the double tab (on the same token) for starting the selection
    if (tapped.current !== token.index) {
      rmTapped(tokens, tapped.current);
      addTapped(tokens, token.index);
      tapped.current = token.index;

      setCurrentToken({ i: token.index });
      setTokenSelection((state) => (state.length === 0 ? state : []));
    } else {
      rmTapped(tapped.current);
      setTokenSelection((state) => updateSelection(state, tokens, token.index, true));
    }
  };

  const onMouseDown = (event) => {
    if (istouch.current) return; // suppress mousedown triggered by quick tap
    // When left button pressed, start new selection
    if (event.which === 1) {
      selectionStarted.current = true;
      setTokenSelection((state) => (state.length === 0 ? state : []));
    }
  };

  const onMouseMove = (event) => {
    if (istouch.current) return;
    // When selection started (mousedown), select tokens hovered over
    if (!editMode && selectionStarted.current) {
      event.preventDefault();
      if (event.which !== 1 && event.which !== 0) return null;

      window.getSelection().empty();
      storeMouseSelection(getToken(tokens, event));
    } else {
      let currentNode = getToken(tokens, event);
      if (currentNode.index !== null) {
        setCurrentToken((state) => ({
          i: state === currentNode.index ? state : currentNode.index,
        }));
        setTokenSelection((state) => updateSelection(state, tokens, currentNode.index, false));
      } else
        setCurrentToken((state) => ({
          i: state === currentNode.index ? state : currentNode.index,
        }));
    }
  };

  const onMouseUp = (event) => {
    if (istouch.current) return;
    // When left mouse key is released, create the annotation
    // note that in case of a single click, the token has not been selected (this happens on move)
    // so this way a click can still be used to open
    if (event.which !== 1 && event.which !== 0) return null;
    const currentNode = storeMouseSelection(getToken(tokens, event));
    window.getSelection().empty();
    //setHoldMouseLeft(false);
    selectionStarted.current = false;

    // this worked before, but is not possible due to touchend not registering position
    //if (currentNode === null) return null;

    // storeMouseSelection does save position to tokenSelection state, but this isn't
    // yet updated within this scope. This results in single clicks (without mousemove)
    // not registering. So if there is no current selection, directly use currentNode as position.
    if (tokenSelection.length > 0 && tokenSelection[0] !== null && tokenSelection[1] !== null) {
      annotationFromSelection(tokens, tokenSelection, triggerCodePopup);
    } else {
      if (currentNode !== null) {
        annotationFromSelection(tokens, [currentNode, currentNode], triggerCodePopup);
      }
    }
  };

  const onContextMenu = (event) => {
    if (event.button === 2) return null;
    event.preventDefault();
    event.stopPropagation();
  };

  const storeMouseSelection = (currentNode) => {
    // select tokens that the mouse/touch is currently pointing at
    setCurrentToken((state) => ({ i: state === currentNode.index ? state : currentNode.index }));
    setTokenSelection((state) => updateSelection(state, tokens, currentNode.index, true));
    return currentNode.index;
  };

  return <></>;
};

const annotationFromSelection = (tokens, selection, triggerCodePopup) => {
  let [from, to] = selection;
  if (from > to) [from, to] = [to, from];

  const annotation = {
    index: tokens[from].index,
    length: tokens[to].length + tokens[to].offset - tokens[from].offset,
    span: [tokens[from].index, tokens[to].index],
    section: tokens[from].section,
    offset: tokens[from].offset,
  };
  triggerCodePopup(tokens[to].index, annotation);
};

const movePosition = (tokens, key, mover, space, editMode, setCurrentToken, setTokenSelection) => {
  let newPosition = mover.position;
  if (key === "ArrowRight") newPosition++;
  if (key === "ArrowLeft") newPosition--;
  if (key === "ArrowUp") newPosition = moveSentence(tokens, mover, "up");
  if (key === "ArrowDown") newPosition = moveSentence(tokens, mover, "down");

  if (newPosition > mover.ntokens) newPosition = mover.ntokens;
  if (newPosition < 0) newPosition = 0;

  if (tokens[newPosition]?.ref == null) {
    if (key === "ArrowLeft" || key === "ArrowUp") {
      const firstUnit = tokens.findIndex((token) => token.codingUnit);
      if (firstUnit < 0) return mover.position;
      newPosition = firstUnit;
    }
    if (key === "ArrowRight" || key === "ArrowDown") {
      const cu = tokens.map((token) => token.codingUnit);
      const firstAfterUnit = cu.lastIndexOf(true);
      if (firstAfterUnit < 0) return mover.position;
      newPosition = firstAfterUnit - 1;
    }
  }

  if (editMode && !tokens[newPosition]?.ref.current.classList.contains("annotated")) {
    if (key === "ArrowRight" || key === "ArrowDown") {
      const nextAnnotation = tokens.findIndex(
        (token, i) =>
          i > newPosition &&
          (token?.ref?.current.classList.contains("allLeft") ||
            token?.ref?.current.classList.contains("anyLeft"))
      );
      if (nextAnnotation < 0) return mover.position;
      newPosition = nextAnnotation;
    }
    if (key === "ArrowLeft" || key === "ArrowUp") {
      let prevAnnotation = -1;
      // look for
      for (let i = newPosition - 1; i >= 0; i--) {
        const allLeft = tokens[i]?.ref?.current.classList.contains("allLeft");
        const anyLeft = tokens[i]?.ref?.current.classList.contains("anyLeft");
        if (!allLeft && !anyLeft) continue;
        prevAnnotation = i;
        break;
      }
      if (prevAnnotation < 0) return mover.position;
      newPosition = prevAnnotation;
    }
  }

  if (!editMode && space) {
    // limit selection to current section
    if (tokens[mover.position].section !== tokens[newPosition].section) {
      if (newPosition > mover.position) {
        for (let i = newPosition; i >= mover.position; i--)
          if (tokens[i].section === tokens[mover.position].section) {
            newPosition = i;
            break;
          }
      } else {
        for (let i = newPosition; i <= mover.position; i++) {
          if (tokens[i].section === tokens[mover.position].section) {
            newPosition = i;
            break;
          }
        }
      }
    }
  }

  if (mover.position !== newPosition) {
    setCurrentToken((state) => ({ i: state === newPosition ? state : newPosition }));
    setTokenSelection((state) => updateSelection(state, tokens, newPosition, !editMode && space));

    const containerRef = tokens[newPosition].containerRef.current;
    const tokenRef = tokens[newPosition].ref.current;
    keepInView(containerRef, tokenRef);

    // const down = key === "ArrowRight" || key === "ArrowDown";
    // tokens[newPosition].ref.current.scrollIntoView(false, {
    //   block: down ? "start" : "end",
    // });
  }
  return newPosition;
};

const moveSentence = (tokens, mover, direction = "up") => {
  // moving sentences is a bit tricky, but we can do it via the refs to the
  // token spans, that provide information about the x and y values

  if (tokens[mover.position]?.ref == null || tokens[mover.startposition]?.ref == null) {
    const firstUnit = tokens.findIndex((token) => token.codingUnit);
    return firstUnit < 0 ? 0 : firstUnit;
  }

  if (direction === "up") {
    return moveUp(tokens, mover.position, mover.startposition);
  }
  if (direction === "down") {
    return moveDown(tokens, mover.position, mover.startposition);
  }
};

const getToken = (tokens, e) => {
  const [n, annotated] = getNode(tokens, e);
  if (n === null) return { index: null, annotated: false };
  return { index: getTokenAttributes(tokens, n), annotated };
};

const addTapped = (tokens, i) => {
  const ref = tokens?.[i]?.ref;
  if (ref?.current) ref.current.classList.add("tapped");
};

const rmTapped = (tokens, i) => {
  const ref = tokens?.[i]?.ref;
  if (ref?.current) ref.current.classList.remove("tapped");
};

const getNode = (tokens, e) => {
  try {
    // sometimes e is Restricted, and I have no clue why,
    // nor how to check this in a condition. hence the try clause
    let n;
    if (e.type === "mousemove" || e.type === "mouseup") n = e.originalTarget || e.path[0];
    if (e.type === "touchmove" || e.type === "touchstart") {
      // stupid hack since someone decided touchmove target is always the starting target (weirdly inconsistent with mousemove)
      // also, this still doesn't work for touchend, which is just arrrggg
      let position = e.touches[0];
      n = document.elementFromPoint(position.clientX, position.clientY);
    }

    if (n?.parentNode?.className === "item") {
      return [null, false];
    }

    if (n) {
      if (n.className.includes("token")) {
        return [n, false];
      }
      if (n.parentNode) {
        if (n.parentNode.className.includes("token")) return [n.parentNode, true];
      }
    }
    return [null, false];
  } catch (e) {
    return [null, false];
  }
};

const getTokenAttributes = (tokens, tokenNode) => {
  return parseInt(tokenNode.getAttribute("tokenindex"));
};

const updateSelection = (selection, tokens, index, add) => {
  if (index === null) return selection;
  let newSelection = [...selection];

  if (!add || newSelection.length === 0) return [index, index];
  if (index === null) return [newSelection[0], null];

  if (tokens[newSelection[0]].section === tokens[index].section) {
    newSelection = [newSelection[0], index];
  } else {
    if (index > newSelection[0]) {
      for (let i = index; i >= newSelection[0]; i--) {
        if (tokens[newSelection[0]].section === tokens[i].section)
          newSelection = [newSelection[0], i];
      }
    } else {
      for (let i = index; i <= newSelection[0]; i++) {
        if (tokens[newSelection[0]].section === tokens[i].section)
          newSelection = [newSelection[0], i];
      }
    }
  }
  // if it hasn't changed, return old to prevent updating the state
  if (
    newSelection.length > 0 &&
    selection[0] === newSelection[0] &&
    selection[1] === newSelection[1]
  ) {
    return selection;
  }
  return newSelection;
};
