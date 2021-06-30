import React, { useEffect, useState } from "react";
import { Input, Loader, Pagination, Segment } from "semantic-ui-react";

const ItemSelector = ({ items, setItem }) => {
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [delayedActivePage, setDelayedActivePage] = useState(1);

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
    <Input
      style={{ padding: 0, margin: 0 }}
      min={1}
      max={items.length}
      onChange={(e, d) => setDelayedActivePage(d.value)}
      type="range"
      labelPosition="left"
      label={
        <Pagination
          secondary
          activePage={delayedActivePage}
          pageItem={
            <Segment style={{ border: "none", boxShadow: "none", padding: 0, leftMargin: "0px" }}>
              <Loader active={loading} content="" />
              {`${delayedActivePage} / ${items.length}`}
            </Segment>
          }
          size={"mini"}
          firstItem={null}
          lastItem={null}
          prevItem={"back"}
          nextItem={"next"}
          siblingRange={0}
          boundaryRange={0}
          ellipsisItem={null}
          totalPages={items.length}
          onPageChange={(e, d) => setActivePage(d.activePage)}
          style={{ fontSize: "9px", border: "none", boxShadow: "none", padding: 0, margin: 0 }}
        ></Pagination>
      }
      value={delayedActivePage}
    />
  );
};

export default ItemSelector;
