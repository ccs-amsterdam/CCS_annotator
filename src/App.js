import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import HeaderMenu from "components/HeaderMenu/HeaderMenu";

// login and authenticated route
import Welcome from "components/routing/Welcome";
import AuthRoute from "components/routing/AuthRoute";

// Main pages. Use below in items to include in header menu
import CodingjobManager from "components/CodingjobManager/CodingjobManager";
import Annotator from "components/Annotator/Annotator";
import LocalJobs from "components/LocalJobs/LocalJobs";

// Change to add new components to the header
// The first item will be the opening page after login
const homepage = "/amcat4annotator";

// TODO: annotate, manage jobs, monitor jobs
const items = [
  { label: "Annotator", path: homepage + "/annotator", Component: Annotator, menu: false },
  { label: "Jobs", path: homepage + "/jobs", Component: LocalJobs, menu: true },
  {
    label: "Codingjob manager",
    path: homepage + "/manager",
    Component: CodingjobManager,
    menu: true,
  },
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
      <HeaderMenu items={items} homepage={homepage}>
        <Switch>
          <Route exact path={homepage} render={() => <Welcome />} />
          {createNavigation(items)}
          <Route exact path={"/"} render={() => <Welcome />} />
        </Switch>
      </HeaderMenu>
    </BrowserRouter>
  );
};

export default App;
