import React from "react";
import { Menu, Sidebar } from "semantic-ui-react";
import { Link, withRouter, useLocation } from "react-router-dom";

import Reset from "./Reset";
import Persist from "./Persist";
import UserName from "./Login";

// This is the index file of HeaderMenu, but importing via index
// breaks. Probably due to the withRouter()

const HeaderMenu = ({ items, children }) => {
  const location = useLocation();
  const menuItems = items.map((item, index) => {
    if (!item.menu) return null;
    return (
      <Menu.Item
        key={"item-" + index}
        index={index}
        as={Link}
        to={item.path}
        header={index === 0}
        active={item.path === location.pathname}
      >
        {item.label}
      </Menu.Item>
    );
  });

  if (location.pathname === "/annotator") return children;
  return (
    <Sidebar.Pushable style={{ height: "100vh" }}>
      <Sidebar as={Menu} inverted animation="push" visible={true} direction={"top"} size="mini">
        {menuItems}
        <Menu.Menu position="right">
          <UserName />
          <Persist />
          <Reset />
        </Menu.Menu>
      </Sidebar>
      <Sidebar.Pusher>{children}</Sidebar.Pusher>
    </Sidebar.Pushable>
  );
};

export default withRouter(HeaderMenu);
