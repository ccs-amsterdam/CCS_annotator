import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import HeaderMenu from "./components/HeaderMenu";
import { Sidebar } from "semantic-ui-react";

// login and authenticated route
import Welcome from "./components/Welcome";
import AuthRoute from "./components/AuthRoute";

// Main pages. Use below in items to include in header menu
import CodingJobs from "./components/CodingJobs";
import Annotate from "./components/Annotate";
import CodeTreeTable from "./components/CodeTreeTable";
import { useSelector } from "react-redux";

// Change to add new components to the header
// The first item will be the opening page after login
const homepage = "/amcat4annotator";
const items = [
  {
    label: "Coding Jobs",
    path: homepage + "/codingjobs",
    Component: CodingJobs,
  },
  { label: "Annotate", path: homepage + "/annotate", Component: Annotate },
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
            <CodeTreeTable showColors />
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
