import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { createSession } from "../Actions";

import newSession from "../apis/amcat";
import { useHistory } from "react-router-dom";
import {
  Button,
  Form,
  Grid,
  Header,
  Image,
  Message,
  Segment,
} from "semantic-ui-react";

const color = "blue";

const LoginForm = ({ items }) => {
  const dispatch = useDispatch();

  const [host, setHost] = useState("http://127.0.0.1:5000");
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [status, setStatus] = useState("idle");
  const history = useHistory();

  const submitForm = async () => {
    setStatus("waiting");
    try {
      const session = await newSession(host, email, password);
      dispatch(createSession(session));
      setStatus("success");
      history.push(items[0].path);
    } catch (e) {
      setStatus("error");
    }
  };

  return (
    <Grid
      inverted
      textAlign="center"
      style={{ height: "100vh" }}
      verticalAlign="middle"
    >
      <Grid.Column style={{ maxWidth: 450 }}>
        <Header as="h2" color={color} textAlign="center">
          <Image src="/amcat-logo.svg" /> Connect to an AmCAT server
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

export default LoginForm;
