import React, { useState } from "react";
import { Menu, Header, Modal } from "semantic-ui-react";
import AmcatLogin from "components/HeaderMenu/AmcatLogin";
import { useLiveQuery } from "dexie-react-hooks";
import db from "apis/dexie";

const Amcat = () => {
  const [open, setOpen] = useState(false);
  const amcat = useLiveQuery(() => db.amcatSession());

  console.log(amcat);

  return (
    <Modal
      closeIcon
      open={open}
      trigger={
        <Menu.Item
          icon={amcat === null ? "toggle off" : "toggle on"}
          name={"AmCAT"}
          style={{ color: amcat === null ? "red" : "green" }}
        />
      }
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
    >
      <Header icon="database" content="Connect to AmCAT server" />
      <Modal.Content>
        <AmcatLogin setOpen={setOpen} />
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
