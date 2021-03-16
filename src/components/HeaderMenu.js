import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { deleteAmcatSession } from "../Actions";
import { Menu, Button, Header, Icon, Modal } from "semantic-ui-react";
import { Link, withRouter, useLocation } from "react-router-dom";

const HeaderMenu = ({ items }) => {
  const amcat = useSelector((state) => state.amcat);
  const location = useLocation();

  const menuItems = items.map((item, index) => {
    return (
      <Menu.Item
        key={"item-" + index}
        index={index}
        as={Link}
        to={item.path}
        header={index === 0}
        disabled={!amcat}
        active={item.path === location.pathname}
      >
        {item.label}
      </Menu.Item>
    );
  });

  return (
    <Menu color="blue" fixed="top" inverted>
      {menuItems}
      <Menu.Menu position="right">
        <LogoutModal />
      </Menu.Menu>
    </Menu>
  );
};

const LogoutModal = () => {
  const amcat = useSelector((state) => state.amcat);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  if (!amcat) return null;

  return (
    <Modal
      closeIcon
      open={open}
      trigger={<Menu.Item icon="power off" name="logout" />}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
    >
      <Header icon="power off" content={`Logout from ${amcat.host}`} />
      <Modal.Content>
        <p>Do you really want to logout?</p>
      </Modal.Content>
      <Modal.Actions>
        <Button
          color="red"
          onClick={() => {
            setOpen(false);
          }}
        >
          <Icon name="remove" /> No
        </Button>
        <Button
          color="green"
          onClick={() => {
            dispatch(deleteAmcatSession());
            setOpen(false);
          }}
        >
          <Icon name="checkmark" /> Yes
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default withRouter(HeaderMenu);
