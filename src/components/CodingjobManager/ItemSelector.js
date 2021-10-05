import React, { useEffect, useState } from "react";
import { Input, Loader, Pagination, Segment } from "semantic-ui-react";

const ItemSelector = ({ items, setItem }) => {
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
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  });

  useEffect(() => {
    if (!items) return null;
    setActivePage(1);
  }, [items, setItem, setActivePage]);

  useEffect(() => {
    if (!items) return null;
    setItem(items[activePage - 1]);
    setDelayedActivePage(activePage);
  }, [items, setItem, activePage]);

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
        max={items.length}
        onChange={(e, d) => setDelayedActivePage(Number(d.value))}
        type="range"
        labelPosition="left"
        label={
          <Pagination
            secondary
            activePage={delayedActivePage}
            pageItem={`${delayedActivePage} / ${items.length}`}
            size={"mini"}
            firstItem={null}
            lastItem={null}
            prevItem={"back"}
            nextItem={"next"}
            siblingRange={0}
            boundaryRange={0}
            ellipsisItem={null}
            totalPages={items.length}
            onClick={(e, d) => e.stopPropagation()}
            onPageChange={(e, d) => setActivePage(Number(d.activePage))}
            style={{ fontSize: "9px", border: "none", boxShadow: "none", padding: 0, margin: 0 }}
          ></Pagination>
        }
        value={delayedActivePage}
      />
    </Segment>
  );
};

export default React.memo(ItemSelector);
