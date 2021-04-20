import React, { useEffect, useState } from "react";
import { Menu, Button, Header, Icon, Modal } from "semantic-ui-react";
import { persist, isStoragePersisted } from "../apis/storemanager";

const Persist = () => {
  const [open, setOpen] = useState(false);
  const [persisted, setPersisted] = useState(false);

  useEffect(() => {
    if (!persisted) {
      isStoragePersisted().then(setPersisted);
    }
  }, [persisted]);

  const onClick = async () => {
    await persist();
    const ispersisted = await isStoragePersisted();
    if (ispersisted) {
      setPersisted(true);
      alert("indexedDB set to persistent for AmCAT Annotator");
    } else {
      alert("Failed to set indexedDB to persistent");
    }
  };

  if (persisted) return null;

  return (
    <Modal
      closeIcon
      open={open}
      trigger={
        <Menu.Item
          icon="database"
          name="Enable persitance"
          style={{ color: "#d7a3a3" }}
        />
      }
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
    >
      <Header icon="database" content="Set database persistence" />
      <Modal.Content>
        <p>
          We did not have permission to automatically make the data storage for
          this website persistent. This means that the data could be removed
          automatically by your browser if it needs to free up space for another
          website. You can try to set this manually here, but not all browsers
          support this (yet).
        </p>
        <p>
          If the database is not persistent the app can still be used, but you
          need to be more carefull in making sure that data is regularly backed
          up, either by manually downloading data or syncing with some backend
          (work in progress).
        </p>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onClick}>
          <Icon name="checkmark" /> Yes
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default Persist;
