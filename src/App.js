import React from "react";
import { HashRouter, Route, Switch } from "react-router-dom";
import HeaderMenu from "components/HeaderMenu/HeaderMenu";

// Main pages. Use below in items to include in header menu
import CodingjobManager from "components/CodingjobManager/CodingjobManager";
import Annotator from "components/Annotator/Annotator";
import LocalJobs from "components/LocalJobs/LocalJobs";

// Change to add new components to the header
// The first item will be the opening page after login
const homepage = "/CCS_annotator";

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

const createRoutes = (items) => {
  return items.map((item) => {
    return <Route exact path={item.path} render={() => <item.Component />} />;
  });
};

const App = () => {
  return (
    <HashRouter basename="/">
      <HeaderMenu items={items} homepage={homepage}>
        <Switch>
          <Route exact path={homepage} render={() => <CodingjobManager />} />
          {createRoutes(items)}
          <Route exact path={"/"} render={() => <CodingjobManager />} />
        </Switch>
      </HeaderMenu>
    </HashRouter>
  );
};

export default App;
