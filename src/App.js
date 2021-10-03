import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import HeaderMenu from "components/HeaderMenu/HeaderMenu";

// login and authenticated route
import Welcome from "components/routing/Welcome";
import AuthRoute from "components/routing/AuthRoute";

// Main pages. Use below in items to include in header menu
import CodingjobManager from "components/CodingjobManager/CodingjobManager";

// Change to add new components to the header
// The first item will be the opening page after login
const homepage = "/home";
const items = [{ label: "Codingjob manager", path: "/manager", Component: CodingjobManager }];

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
      <HeaderMenu items={items} homepage={homepage}>
        <Switch>
          <Route exact path={homepage} render={() => <Welcome items={items} />} />
          {createNavigation(items)}
        </Switch>
      </HeaderMenu>
    </BrowserRouter>
  );
};

export default App;
