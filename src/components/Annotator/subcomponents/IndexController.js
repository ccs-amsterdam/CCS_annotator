import React, { useEffect, useState, useRef } from "react";
import { Loader, Pagination, Segment } from "semantic-ui-react";

const IndexController = ({
  n,
  index,
  setIndex,
  canGoForward = true,
  canGoBack = true,
  quickKeyNext = false,
}) => {
  const reached = useRef(0); // if canGoBack but not canGoForward, can still go forward after going back
  const canMove = useRef(false);

  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [delayedActivePage, setDelayedActivePage] = useState(1);

  // const onKeyDown = (e) => {
  //   if (e.ctrlKey && e.keyCode === 13) {
  //     e.preventDefault();
  //     if (!canGoForward && !quickKeyNext) return;
  //     if (e.repeat) {
  //       setDelayedActivePage((current) => {
  //         if (canGoForward || current < reached.current)
  //           return current < n + 1 ? current + 1 : current;
  //         return current;
  //       });
  //     } else {
  //       setActivePage((current) => {
  //         if (quickKeyNext || canGoForward || current < reached.current)
  //           return current < n + 1 ? current + 1 : current;
  //         return current;
  //       });
  //     }
  //   }
  //   if (e.ctrlKey && e.keyCode === 8) {
  //     e.preventDefault();
  //     if (!canGoBack) return;
  //     if (e.repeat) {
  //       setDelayedActivePage((current) => (current > 1 ? current - 1 : current));
  //     } else {
  //       setActivePage((current) => (current > 1 ? current - 1 : current));
  //     }
  //   }
  // };

  useEffect(() => {
    if (index !== null) setActivePage(Math.min(index + 1, n + 1));
    if (index === null) setActivePage(n + 1);
  }, [index, n, setActivePage]);

  // useEffect(() => {
  //   if (quickKeyNext || canGoForward || canGoBack) window.addEventListener("keydown", onKeyDown);
  //   return () => {
  //     window.removeEventListener("keydown", onKeyDown);
  //   };
  // });

  useEffect(() => {
    reached.current = 0;
    canMove.current = false;
  }, [n]);

  useEffect(() => {
    if (!n) return null;
    setActivePage(1);
    canMove.current = true;
  }, [n, setActivePage]);

  useEffect(() => {
    if (!n) return null;
    reached.current = Math.max(activePage, reached.current);
    if (activePage - 1 === n) {
      setIndex(null);
    } else {
      setIndex(activePage - 1);
    }
    setDelayedActivePage(activePage);
  }, [n, setIndex, activePage]);

  useEffect(() => {
    if (!n) return null;
    if (activePage === delayedActivePage) {
      setLoading(false);
      return null;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      setActivePage(delayedActivePage);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [activePage, delayedActivePage, n, setLoading]);

  if (!n) return null;
  const progress = (100 * Math.max(0, reached.current - 1)) / n;

  return (
    <Segment
      style={{
        display: "flex",
        border: "none",
        boxShadow: "none",
        padding: "0",
        marginTop: "5px",
        leftMargin: "0px",
        width: "100%",
        maxHeight: "35px",
        borderRadius: "0",
      }}
    >
      <Loader active={loading} content="" />
      <Pagination
        secondary
        activePage={delayedActivePage}
        pageItem={delayedActivePage <= n ? `${delayedActivePage} / ${n}` : `done / ${n}`}
        size={"mini"}
        firstItem={null}
        lastItem={null}
        prevItem={canGoBack ? "back" : "   "}
        nextItem={canGoForward || activePage < reached.current ? "next" : "   "}
        siblingRange={0}
        boundaryRange={0}
        ellipsisItem={null}
        totalPages={n + 1}
        onClick={(e, d) => e.stopPropagation()}
        onPageChange={(e, d) => {
          if ((canGoForward || activePage < reached.current) && Number(d.activePage) > activePage)
            setActivePage(Number(d.activePage));
          if (canGoBack && Number(d.activePage) < activePage) setActivePage(Number(d.activePage));
        }}
        style={{ fontSize: "9px", border: "none", boxShadow: "none", padding: 0, margin: 0 }}
      />
      <input
        style={{
          flex: "1 1 auto",
          background: `linear-gradient(to right, #7dd48d ${progress}%, #fff ${progress}% 100%, #fff 100%)`,
        }}
        min={1}
        max={n + 1}
        onChange={(e) => {
          if (Number(e.target.value) > delayedActivePage) {
            if (canGoForward) {
              setDelayedActivePage(Number(e.target.value));
            } else {
              setDelayedActivePage(Math.min(reached.current, Number(e.target.value)));
            }
          }
          if (canGoBack && Number(e.target.value) < delayedActivePage)
            setDelayedActivePage(Number(e.target.value));
        }}
        type="range"
        value={delayedActivePage}
      />
    </Segment>
  );
};

export default IndexController;
