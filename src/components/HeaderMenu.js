import React from "react";
import { Menu, Sidebar } from "semantic-ui-react";
import { Link, withRouter, useLocation } from "react-router-dom";
import db from "../apis/dexie";

//import ExportCodingjob from "./ExportCodingjob";
import Reset from "./Reset";
import Persist from "./Persist";
import CodebookSidebar from "./CodebookSidebar";
import PreviewMode from "./PreviewMode";

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

  return (
    <Sidebar.Pushable>
      <Sidebar as={Menu} inverted animation="push" visible={true} direction={"top"} size="mini">
        {menuItems}
        <Menu.Menu position="right">
          {/* <ExportCodingjob /> */}
          {location.pathname.includes("annotate") ? (
            <>
              <PreviewMode />
              <CodebookSidebar />
            </>
          ) : (
            <>
              <Persist />
              <Reset homepage={homepage} />
            </>
          )}
        </Menu.Menu>
      </Sidebar>
      <Sidebar.Pusher>{children}</Sidebar.Pusher>
    </Sidebar.Pushable>
  );
};

export default withRouter(HeaderMenu);
