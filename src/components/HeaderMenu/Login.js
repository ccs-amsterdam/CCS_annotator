import React, { useEffect, useState } from "react";
import { Menu, Header, Modal, Form, Button, Segment, Grid, Divider } from "semantic-ui-react";
import { useCookies } from "react-cookie";
import { blockEvents } from "actions";
import { useDispatch } from "react-redux";
import { getToken } from "apis/amcat";

const Login = ({ host = null, force = false }) => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [cookies, setCookies] = useCookies(["amcat"]);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    dispatch(blockEvents(open));
    return () => {
      dispatch(blockEvents(false));
    };
  }, [dispatch, open]);

  useEffect(() => {
    if (loggedIn) return;
    checkToken(cookies.amcat, setCookies, setLoggedIn);
  }, [cookies, loggedIn, setCookies, setLoggedIn]);

  // const renderForm = () => {
  //   const amcat = cookies.amcat || {
  //     host: "http://localhost:5000",
  //     email: "test@user.com",
  //     token: null,
  //   };
  //   if (host) amcat.host = host;
  //   const setLogin = (value) => {
  //     setCookies("amcat", JSON.stringify(value), { path: "/" });
  //     setLoggedIn(true);
  //     setOpen(false);
  //   };
  //   const setLogout = () => {
  //     setCookies("amcat", JSON.stringify({ ...amcat, token: null }), { path: "/" });
  //     setLoggedIn(false);
  //   };
  //   if (amcat.token) return <SignOut amcat={amcat} setLogout={setLogout} />;
  //   return <SignIn setOpen={setOpen} amcat={amcat} setLogin={setLogin} />;
  // };

  return (
    <Modal
      closeIcon={!force}
      open={open || force}
      trigger={
        <Menu.Item
          icon={loggedIn ? "toggle on" : "toggle off"}
          name={loggedIn ? "Sign out" : "Sign in"}
          style={{ color: cookies?.login?.token == null ? "red" : "green" }}
        />
      }
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
    >
      <LoginForm
        cookies={cookies}
        setCookies={setCookies}
        setLoggedIn={setLoggedIn}
        setOpen={setOpen}
        host={host}
      />
    </Modal>
  );
};

export const LoginForm = ({ cookies, setCookies, setLoggedIn, setOpen, host = null }) => {
  const amcat = cookies.amcat || {
    host: "http://localhost:5000",
    email: "test@user.com",
    token: null,
  };

  if (host) amcat.host = host;

  const setLogin = (value) => {
    setCookies("amcat", JSON.stringify(value), { path: "/" });
    setLoggedIn(true);
    setOpen(false);
  };
  const setLogout = () => {
    setCookies("amcat", JSON.stringify({ ...amcat, token: null }), { path: "/" });
    setLoggedIn(false);
  };

  if (amcat.token) return <SignOut amcat={amcat} setLogout={setLogout} />;
  return <SignIn setOpen={setOpen} amcat={amcat} setLogin={setLogin} />;
};

const checkToken = async (amcat) => {
  if (!amcat?.token) {
    return;
  }
};

const SignOut = ({ amcat, setLogout }) => {
  return (
    <>
      <Header icon="user" content="Sign out" />
      <Modal.Content>
        <Grid textAlign="center">
          <Grid.Column>
            <Button secondary onClick={setLogout}>
              Sign out from <span style={{ color: "lightblue" }}>{amcat.email}</span>
            </Button>
          </Grid.Column>
        </Grid>
      </Modal.Content>
    </>
  );
};

const SignIn = ({ amcat, setLogin }) => {
  const [host, setHost] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invalidPassword, setInvalidPassword] = useState(false);

  const passwordLogin = async () => {
    setPassword("");
    try {
      const token = await getToken(host, email, password);
      setLogin({ ...amcat, token });
    } catch (e) {
      setInvalidPassword(true);
      console.log(e);
    }
  };

  const emailError = !email.match(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );

  useEffect(() => {
    if (amcat?.email) setEmail(amcat.email);
    if (amcat?.host) setHost(amcat.host);
  }, [amcat]);

  return (
    <>
      <Header icon="user" content="Register or sign in" />
      <Modal.Content>
        <Segment placeholder attached="bottom">
          <Grid stackable textAlign="center">
            <Grid.Row>
              <Grid.Column>
                <Form>
                  <Form.Input
                    placeholder="Host"
                    name="host"
                    label="Host"
                    value={host}
                    onChange={(e, d) => {
                      if (d.value.length < 100) setHost(d.value);
                    }}
                    icon="home"
                    iconPosition="left"
                    autoFocus
                  />
                  <Form.Input
                    placeholder="email adress"
                    error={emailError ? "Please enter a valid email adress" : false}
                    name="email"
                    label="Email"
                    icon="mail"
                    iconPosition="left"
                    value={email}
                    onChange={(e, d) => {
                      if (d.value.length < 100) setEmail(d.value);
                    }}
                  />
                </Form>
              </Grid.Column>
            </Grid.Row>
          </Grid>
          <Divider />
          <Grid columns={2} textAlign="center">
            <Grid.Row verticalAlign="middle">
              <Grid.Column>
                <Form>
                  <Button circular primary fluid style={{ width: "7em", height: "7em" }}>
                    Send link by email
                  </Button>
                </Form>
              </Grid.Column>
              <Divider vertical>Or</Divider>
              <Grid.Column>
                <Form>
                  <Form.Input
                    placeholder="password"
                    name="password"
                    error={invalidPassword ? "Invalid password for this host & email" : false}
                    label="Password"
                    type="password"
                    icon="lock"
                    iconPosition="left"
                    value={password}
                    onChange={(e, d) => {
                      setInvalidPassword(false);
                      setPassword(d.value);
                    }}
                  />
                  <Button disabled={password.length === 0} primary fluid onClick={passwordLogin}>
                    Sign in
                  </Button>
                </Form>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment>
      </Modal.Content>
    </>
  );
};

export default Login;
