import React, { useState } from "react";
import { getToken } from "apis/amcat";
import { Button, Form, Grid, Header, Message, Segment, Menu, Modal } from "semantic-ui-react";
import { useCookies } from "react-cookie";

const Amcat = () => {
  const [open, setOpen] = useState(false);
  const [cookies, setCookie] = useCookies(["amcat"]);
  console.log(cookies);

  return (
    <Modal
      closeIcon
      open={open}
      trigger={
        <Menu.Item
          icon={cookies.amcat == null ? "toggle off" : "toggle on"}
          name={"AmCAT"}
          style={{ color: cookies.amcat == null ? "red" : "green" }}
        />
      }
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
    >
      <Header icon="database" content="Connect to AmCAT server" />
      <Modal.Content>
        <AmcatLogin setOpen={setOpen} setCookie={setCookie} />
      </Modal.Content>
    </Modal>
  );
};

const color = "blue";

const AmcatLogin = ({ setOpen, setCookie }) => {
  const [host, setHost] = useState("https://amcat4.labs.vu.nl/api");
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [status, setStatus] = useState("idle");

  const submitForm = async () => {
    setStatus("waiting");
    try {
      const token = await getToken(host, email, password);
      if (token) {
        console.log("test");
        setCookie("amcat", JSON.stringify({ host, email, token }), { path: "/" });
        setStatus("success");
        setOpen(false);
      } else setStatus("error");
    } catch (e) {
      console.log(e);
      setStatus("error");
    }
  };

  return (
    <Grid inverted textAlign="center" style={{ height: "50%" }} verticalAlign="middle">
      <Grid.Column style={{ maxWidth: 450 }}>
        <Header as="h2" color={color} textAlign="center">
          Connect to AmCAT server
        </Header>
        <Form size="large">
          <Segment stacked>
            <Form.Input
              fluid
              error={status === "error"}
              value={host}
              onChange={(e, { value }) => {
                setStatus("idle");
                setHost(value);
              }}
              icon="home"
              iconPosition="left"
              placeholder="Host"
            />
            <Form.Input
              fluid
              error={status === "error"}
              value={email}
              onChange={(e, { value }) => {
                setStatus("idle");
                setEmail(value);
              }}
              icon="user"
              iconPosition="left"
              placeholder="Email adress"
            />
            <Form.Input
              fluid
              error={status === "error"}
              value={password}
              onChange={(e, { value }) => {
                setStatus("idle");
                setPassword(value);
              }}
              icon="lock"
              iconPosition="left"
              placeholder="Password"
              type="password"
            />

            <Button onClick={submitForm} color={color} fluid size="large">
              Login
            </Button>
          </Segment>
        </Form>
        <Message>Don't have an account? Too bad</Message>
      </Grid.Column>
    </Grid>
  );
};

export default Amcat;
