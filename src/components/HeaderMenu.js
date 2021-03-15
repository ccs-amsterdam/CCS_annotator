import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { deleteSession } from "../Actions";
import { Menu, Button, Header, Icon, Modal } from "semantic-ui-react";
import { Link, withRouter, useLocation } from "react-router-dom";

const HeaderMenu = ({ items }) => {
  const session = useSelector((state) => state.session);
  const location = useLocation();

  const menuItems = items.map((item, index) => {
    return (
      <Menu.Item
        key={"item-" + index}
        index={index}
        as={Link}
        to={item.path}
        header={index === 0}
        disabled={!session}
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
  const session = useSelector((state) => state.session);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  if (!session) return null;

  return (
    <Modal
      closeIcon
      open={open}
      trigger={<Menu.Item icon="power off" name="logout" />}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
    >
      <Header icon="power off" content={`Logout from ${session.host}`} />
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
            dispatch(deleteSession());
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
