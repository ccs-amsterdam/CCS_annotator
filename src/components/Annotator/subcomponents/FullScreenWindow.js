import React, { useState, useEffect } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { Icon, Modal, Button } from "semantic-ui-react";

export const FullScreenWindow = ({ children }) => {
  const fsHandle = useFullScreenHandle();
  const fullScreenButton = <FullScreenButton handle={fsHandle} />;

  return (
    <FullScreen handle={fsHandle}>
      <DOMNodeProvider style={{ height: "100%" }}>
        {(fullScreenNode) => {
          // FullScreenFix children should be called as a function to pass on the fullScreenNode argument
          return (
            <>
              <AskFullScreenModal handle={fsHandle} />
              {children(fullScreenNode, fullScreenButton)}
            </>
          );
        }}
      </DOMNodeProvider>
    </FullScreen>
  );
};

const DOMNodeProvider = ({ children }) => {
  // due to a bug in react-full-screen, pass on a 'fullScreenNode', which tells the popup
  // where to mount.
  // https://github.com/Semantic-Org/Semantic-UI-React/issues/4191
  const [fullScreenNode, setFullScreenNode] = useState(null);

  return (
    <div className="dom-node-provider" ref={setFullScreenNode}>
      {children(fullScreenNode)}
    </div>
  );
};

const AskFullScreenModal = ({ handle }) => {
  let [askFullscreen, setAskFullscreen] = useState(true);

  useEffect(() => {
    // this used to have location as dep
    setAskFullscreen(true);
  }, [setAskFullscreen]);

  // Disable for now. Seems to not work in Apple devices
  //askFullscreen = false;

  return (
    <Modal open={askFullscreen}>
      <Modal.Header>Fullscreen mode</Modal.Header>
      <Modal.Content>
        <p>
          We recommend working in fullscreen, especially on mobile devices. You can always change
          this with the button in the top-right corner. For some devices fullscreen might not work.
        </p>
        <div style={{ display: "flex", height: "30%" }}>
          <Button
            primary
            size="massive"
            onClick={() => {
              if (!handle.active) handle.enter();
              setAskFullscreen(false);
            }}
            style={{ flex: "1 1 auto" }}
          >
            Fullscreen
          </Button>
          <Button
            secondary
            size="massive"
            onClick={() => {
              if (handle.active) handle.exit();
              setAskFullscreen(false);
            }}
            style={{ flex: "1 1 auto" }}
          >
            Windowed
          </Button>
        </div>
      </Modal.Content>
    </Modal>
  );
};

const FullScreenButton = ({ handle }) => {
  return (
    <Icon.Group
      size="big"
      style={{ paddingRight: "10px", position: "absolute", top: "0px", right: 0 }}
    >
      <Icon
        link
        name={handle.active ? "window close" : "expand"}
        onClick={() => {
          handle.active ? handle.exit() : handle.enter();
        }}
      />
    </Icon.Group>
  );
};

export default FullScreenWindow;
