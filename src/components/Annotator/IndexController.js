import React, { useEffect, useState, useRef } from "react";
import { Input, Loader, Pagination, Segment } from "semantic-ui-react";
import { useSelector, useDispatch } from "react-redux";

const IndexController = ({ n, setIndex, canControl = true }) => {
  const moveUnitIndex = useSelector((state) => state.moveUnitIndex);
  const canMove = useRef(false);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [delayedActivePage, setDelayedActivePage] = useState(1);

  const onKeyDown = (e) => {
    if (e.keyCode === 9) {
      e.preventDefault();
      if (e.shiftKey) {
        if (e.repeat) {
          setDelayedActivePage((current) => (current > 1 ? current - 1 : current));
        } else {
          setActivePage((current) => (current > 1 ? current - 1 : current));
        }
      } else {
        if (e.repeat) {
          setDelayedActivePage((current) => (current < n + 1 ? current + 1 : current));
        } else {
          setActivePage((current) => (current < n + 1 ? current + 1 : current));
        }
      }
    }
  };

  useEffect(() => {
    if (canControl) window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  });

  useEffect(() => {
    canMove.current = false;
  }, [n]);

  useEffect(() => {
    if (!canMove.current) return;
    if (n) {
      const newn = moveUnitIndex > 0 ? n + 1 : n - 1;
      setActivePage((current) => Math.min(newn, current + 1));
    }
  }, [n, moveUnitIndex]);

  useEffect(() => {
    if (!n) return null;
    setActivePage(1);
    canMove.current = true;
  }, [n, setActivePage, dispatch]);

  useEffect(() => {
    if (!n) return null;
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

  return (
    <Segment
      style={{
        border: "none",
        boxShadow: "none",
        padding: "0",
        leftMargin: "0px",
        width: "100%",
        maxHeight: "35px",
      }}
    >
      <Loader active={loading} content="" />

      <Input
        style={{ padding: "0 !important", margin: "0", width: "100%" }}
        min={1}
        max={n + 1}
        onChange={(e, d) => {
          if (canControl) setDelayedActivePage(Number(d.value));
        }}
        type="range"
        labelPosition="left"
        label={
          <Pagination
            secondary
            activePage={delayedActivePage}
            pageItem={delayedActivePage <= n ? `${delayedActivePage} / ${n}` : "done"}
            size={"mini"}
            firstItem={null}
            lastItem={null}
            prevItem={canControl ? "back" : null}
            nextItem={canControl ? "next" : null}
            siblingRange={0}
            boundaryRange={0}
            ellipsisItem={null}
            totalPages={n + 1}
            onClick={(e, d) => e.stopPropagation()}
            onPageChange={(e, d) => {
              if (canControl) setActivePage(Number(d.activePage));
            }}
            style={{ fontSize: "9px", border: "none", boxShadow: "none", padding: 0, margin: 0 }}
          ></Pagination>
        }
        value={delayedActivePage}
      />
    </Segment>
  );
};

export default IndexController;
