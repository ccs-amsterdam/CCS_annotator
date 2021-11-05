import React, { useEffect, useState } from "react";
import { Menu, Header, Modal, Form, Button } from "semantic-ui-react";
import { useCookies } from "react-cookie";

const UserName = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cookies, setCookies] = useCookies(["name"]);

  const storeName = () => {
    if (name.length < 5) return;
    setCookies("name", name, { path: "/" });
    setOpen(false);
  };

  useEffect(() => {
    if (cookies.name) setName(cookies.name);
  }, [cookies.name]);

  return (
    <Modal
      closeIcon
      open={open}
      trigger={
        <Menu.Item
          icon={cookies.name == null ? "toggle off" : "toggle on"}
          name={"Name"}
          style={{ color: cookies.name == null ? "red" : "green" }}
        />
      }
      style={{ width: "23em" }}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
    >
      <Header icon="user" content="Set user name" />
      <Modal.Content>
        <Form onSubmit={storeName}>
          <Form.Input
            placeholder="username"
            value={name}
            onChange={(e, d) => {
              if (d.value.length < 50) setName(d.value);
            }}
            autoFocus
            style={{ width: "18em" }}
          />
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button primary disabled={name.length < 5} onClick={storeName}>
          {name.length < 5 ? "please use 5 characters or more" : "Set user name"}
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default UserName;
