import React, { useEffect, useState } from "react";
import { Input, Loader, Pagination, Segment } from "semantic-ui-react";
import { useSelector, useDispatch } from "react-redux";
import { resetFinishedUnit } from "actions";

const ItemSelector = ({ items, setItem, canControl = true, setFinished }) => {
  const finishedUnit = useSelector((state) => state.finishedUnit);
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
          setDelayedActivePage((current) => (current < items.length ? current + 1 : current));
        } else {
          setActivePage((current) => (current < items.length ? current + 1 : current));
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
    if (!items) return null;
    dispatch(resetFinishedUnit());
    setActivePage(1);
  }, [items, setItem, setActivePage, dispatch]);

  useEffect(() => {
    if (finishedUnit > 0 && items) {
      setActivePage((current) => Math.min(items.length + 1, current + 1));
    }
  }, [items, finishedUnit]);

  useEffect(() => {
    if (!items) return null;
    if (activePage === items.length && setFinished != null) {
      setFinished(true);
      setItem(null);
    } else {
      setItem(items[activePage - 1]);
    }
    setDelayedActivePage(activePage);
  }, [items, setItem, setFinished, activePage]);

  useEffect(() => {
    if (!items) return null;
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
  }, [activePage, delayedActivePage, items, setLoading]);

  if (!items) return null;

  return (
    <Segment
      style={{ border: "none", boxShadow: "none", padding: "0", leftMargin: "0px", width: "100%" }}
    >
      <Loader active={loading} content="" />

      <Input
        style={{ padding: 0, margin: 0, width: "100%" }}
        min={1}
        max={items.length + 1}
        onChange={(e, d) => {
          if (canControl) setDelayedActivePage(Number(d.value));
        }}
        type="range"
        labelPosition="left"
        label={
          <Pagination
            secondary
            activePage={delayedActivePage}
            pageItem={
              delayedActivePage <= items.length ? `${delayedActivePage} / ${items.length}` : "done"
            }
            size={"mini"}
            firstItem={null}
            lastItem={null}
            prevItem={canControl ? "back" : null}
            nextItem={canControl ? "next" : null}
            siblingRange={0}
            boundaryRange={0}
            ellipsisItem={null}
            totalPages={items.length + 1}
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

export default React.memo(ItemSelector);
