import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import HeaderMenu from "./components/HeaderMenu";
import { Divider, Container } from "semantic-ui-react";

import AmcatLogin from "./components/AmcatLogin";
import Query from "./components/Query";
import Create from "./components/Create";
import Annotate from "./components/Annotate";
import AuthRoute from "./components/AuthRoute";

// Change to add new components to the header
// The first item will be the opening page after login
const items = [
  { label: "Query", path: "/query", Component: Query },
  { label: "Create", path: "/create", Component: Create },
  { label: "Annotate", path: "/annotate", Component: Annotate },
];

const App = () => {
  const createNavigation = (items) => {
    return items.map((item) => {
      return <AuthRoute path={item.path} Component={item.Component} />;
    });
  };

  return (
    <BrowserRouter>
      <HeaderMenu items={items} />
      <Divider />
      <Container style={{ marginTop: "3em" }}>
        <Switch>
          <Route exact path="/" render={() => <AmcatLogin items={items} />} />
          {createNavigation(items)}
        </Switch>
      </Container>
    </BrowserRouter>
  );
};

export default App;
