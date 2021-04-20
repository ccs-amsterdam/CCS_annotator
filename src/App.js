import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import HeaderMenu from "./components/HeaderMenu";
import { Divider, Container } from "semantic-ui-react";

// login and authenticated route
import Welcome from "./components/Welcome";
import AuthRoute from "./components/AuthRoute";

// Main pages. Use below in items to include in header menu
import Create from "./components/Create";
import Annotate from "./components/Annotate";

// Change to add new components to the header
// The first item will be the opening page after login
const host = "https://ccs-amsterdam.github.io";
const homepage = "/amcat4annotator";
const items = [
  { label: "Create", path: homepage + "/create", Component: Create },
  { label: "Annotate", path: homepage + "/annotate", Component: Annotate },
];

const App = () => {
  const createNavigation = (items) => {
    return items.map((item) => {
      return (
        <AuthRoute
          key={item.path}
          path={item.path}
          homepage={homepage}
          Component={item.Component}
        />
      );
    });
  };

  return (
    <BrowserRouter>
      <HeaderMenu items={items} host={host} homepage={homepage} />
      <Divider />
      <Container style={{ marginTop: "3em" }}>
        <Switch>
          <Route
            exact
            path={homepage}
            render={() => <Welcome items={items} />}
          />
          {createNavigation(items)}
        </Switch>
      </Container>
    </BrowserRouter>
  );
};

export default App;
