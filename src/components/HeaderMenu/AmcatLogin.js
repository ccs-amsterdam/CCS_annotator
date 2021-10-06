import React, { useState } from "react";

import newAmcatSession from "apis/amcat";
import { Button, Form, Grid, Header, Message, Segment } from "semantic-ui-react";

const color = "blue";

const AmcatLogin = ({ setAmcatConnection, setOpen }) => {
  const [host, setHost] = useState("https://amcat4.labs.vu.nl/api");
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [status, setStatus] = useState("idle");

  const submitForm = async () => {
    setStatus("waiting");
    try {
      const amcat = await newAmcatSession(host, email, password);
      if (amcat) {
        setAmcatConnection(amcat);
        setStatus("success");
        setOpen(false);
      }
    } catch (e) {
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

export default AmcatLogin;
