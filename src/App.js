import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import HeaderMenu from "components/HeaderMenu/HeaderMenu";
import { Sidebar } from "semantic-ui-react";

// login and authenticated route
import Welcome from "components/routing/Welcome";
import AuthRoute from "components/routing/AuthRoute";

// Main pages. Use below in items to include in header menu
import CodingjobManager from "components/CodingjobManager/CodingjobManager";
import CodingJobsPage from "components/CodingJobsPage/CodingJobsPage";
import AnnotatePage from "components/AnnotatePage/AnnotatePage.js";
import CodeBook from "components/CodeBook/CodeBook";
import { useSelector } from "react-redux";

// Change to add new components to the header
// The first item will be the opening page after login
const homepage = "/home";
const items = [
  {
    label: "Coding Jobs",
    path: "/codingjobs",
    Component: CodingJobsPage,
  },
  { label: "Codingjob manager", path: "/manager", Component: CodingjobManager },
  { label: "Annotate", path: "/annotate", Component: AnnotatePage },
];

const App = () => {
  const showSidebar = useSelector((state) => state.showSidebar);

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
        <Sidebar.Pushable>
          <Sidebar
            animation="overlay"
            visible={showSidebar}
            direction={"right"}
            width="very wide"
            style={{ backgroundColor: "white" }}
          >
            <CodeBook showColors />
          </Sidebar>
          <Sidebar.Pusher>
            <Switch>
              <Route exact path={homepage} render={() => <Welcome items={items} />} />
              {createNavigation(items)}
            </Switch>
          </Sidebar.Pusher>
        </Sidebar.Pushable>
      </HeaderMenu>
    </BrowserRouter>
  );
};

export default App;
