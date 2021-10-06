import React, { useState } from "react";
import { Menu, Header, Modal } from "semantic-ui-react";
import AmcatLogin from "components/HeaderMenu/AmcatLogin";

const Amcat = () => {
  const [open, setOpen] = useState(false);
  const [amcatConnection, setAmcatConnection] = useState(null);

  //   const onClick = async () => {
  //     await persist();
  //     const ispersisted = await isStoragePersisted();
  //     if (ispersisted) {
  //       setPersisted(true);
  //       alert("indexedDB set to persistent for AmCAT Annotator");
  //     } else {
  //       alert("Failed to set indexedDB to persistent");
  //     }
  //   };

  return (
    <Modal
      closeIcon
      open={open}
      trigger={
        <Menu.Item
          icon={amcatConnection === null ? "toggle off" : "toggle on"}
          name={"AmCAT"}
          style={{ color: amcatConnection === null ? "red" : "green" }}
        />
      }
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
    >
      <Header icon="database" content="Connect to AmCAT server" />
      <Modal.Content>
        <AmcatLogin setAmcatConnection={setAmcatConnection} setOpen={setOpen} />
      </Modal.Content>
      {/* <Modal.Actions>
        <Button onClick={onClick}>
          <Icon name="checkmark" /> Yes
        </Button>
      </Modal.Actions> */}
    </Modal>
  );
};

export default Amcat;
