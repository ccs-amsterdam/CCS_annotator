import React from "react";
import { Menu } from "semantic-ui-react";
import { Link, withRouter, useLocation } from "react-router-dom";
import db from "../apis/dexie";

import Download from "./Download";
import Reset from "./Reset";
import Persist from "./Persist";
import CodebookSidebar from "./CodebookSidebar";

const HeaderMenu = ({ items, homepage }) => {
  const location = useLocation();

  const menuItems = items.map((item, index) => {
    return (
      <Menu.Item
        key={"item-" + index}
        index={index}
        as={Link}
        to={item.path}
        header={index === 0}
        disabled={!db}
        active={item.path === location.pathname}
      >
        {item.label}
      </Menu.Item>
    );
  });

  return (
    <Menu fixed="top" inverted>
      {menuItems}
      <Menu.Menu position="right">
        {location.pathname.includes("annotate") ? (
          <CodebookSidebar />
        ) : (
          <>
            <Download />
            <Persist />
            <Reset homepage={homepage} />
          </>
        )}
      </Menu.Menu>
    </Menu>
  );
};

export default withRouter(HeaderMenu);