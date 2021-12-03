import React, { useEffect, useState } from "react";
import { Menu, Header, Modal, Form, Button } from "semantic-ui-react";
import { useCookies } from "react-cookie";

const UserName = ({ force = false }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cookies, setCookies] = useCookies(["name"]);

  const storeName = () => {
    if (name.length < 5) return;
    setCookies("name", name, { path: "/" });
    setOpen(false);
  };

  const invalidEmail = (email) => {
    return false;
    //return !email.match(
    //  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    //);
  };

  useEffect(() => {
    if (cookies.name) setName(cookies.name);
  }, [cookies.name]);

  return (
    <Modal
      closeIcon={!force}
      open={open || force}
      trigger={
        <Menu.Item
          icon={cookies.name == null ? "toggle off" : "toggle on"}
          name={"Email"}
          style={{ color: cookies.name == null ? "red" : "green" }}
        />
      }
      style={{ width: "23em" }}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
    >
      <Header icon="user" content="Email adress" />
      <Modal.Content>
        <Form onSubmit={storeName}>
          <Form.Input
            placeholder="username"
            name="email"
            value={name}
            onChange={(e, d) => {
              if (d.value.length < 100) setName(d.value);
            }}
            autoFocus
            style={{ width: "18em" }}
          />
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button primary disabled={invalidEmail(name)} onClick={storeName}>
          {invalidEmail(name) ? "please enter a valid email adress" : "Set email adress"}
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default UserName;
