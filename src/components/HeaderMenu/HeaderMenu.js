import React from "react";
import { Menu, Sidebar } from "semantic-ui-react";
import { Link, withRouter, useLocation } from "react-router-dom";
import db from "apis/dexie";

import Reset from "./Reset";
import Persist from "./Persist";

// This is the index file of HeaderMenu, but importing via index
// breaks. Probably due to the withRouter()

const HeaderMenu = ({ items, homepage, children }) => {
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

  if (location.pathname === "/annotator") return children;
  return (
    <Sidebar.Pushable style={{ height: "100vh" }}>
      <Sidebar
        as={Menu}
        inverted
        animation="push"
        visible={location.pathname !== "/annotator"}
        direction={"top"}
        size="mini"
      >
        {menuItems}
        <Menu.Menu position="right">
          <Persist />
          <Reset homepage={homepage} />
        </Menu.Menu>
      </Sidebar>
      <Sidebar.Pusher>{children}</Sidebar.Pusher>
    </Sidebar.Pushable>
  );
};

export default withRouter(HeaderMenu);
