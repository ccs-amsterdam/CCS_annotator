import React from "react";
import { useSelector } from "react-redux";
import { Menu } from "semantic-ui-react";
import { Link, withRouter, useLocation } from "react-router-dom";
import Dropbox from "./Dropbox";
import Download from "./Download";
import Reset from "./Reset";
import Persist from "./Persist";

const HeaderMenu = ({ items }) => {
  const db = useSelector((state) => state.db);
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
        <Dropbox />
        <Download />
        <Persist />
        <Reset />
      </Menu.Menu>
    </Menu>
  );
};

export default withRouter(HeaderMenu);
