import React, { useEffect, useState } from "react";
import {
  Header,
  Button,
  Modal,
  Form,
  Loader,
  Dimmer,
  Icon,
  Segment,
  Container,
  Grid,
} from "semantic-ui-react";

import db from "apis/dexie";

import DataTable from "./DexieTable";

/**
 * A wrapper around DexieTable with some basic styling and buttons for creating/deleting rows
 * onCreate and onDelete are optional functions performed when creating/deleting an item,
 * receiving the id as argument. onDelete is async, but deletion will only happen if successful
 */
const DexieTableManager = ({
  table,
  itemLabel,
  columns,
  setSelected,
  reverse = true,
  onCreate,
  onDelete,
}) => {
  const [item, setItem] = useState(null);

  useEffect(() => {
    if (setSelected) setSelected(item);
  }, [item, setSelected]);

  return (
    <Grid centered stackable columns={1}>
      <Grid.Column width={6}>
        <Header textAlign="center" style={{ background: "#1B1C1D", color: "white" }}>
          Select {itemLabel}
        </Header>
        <Segment style={{ border: "0" }}>
          <Button.Group widths="2" size="mini">
            <CreateItem setItem={setItem} table={table} itemLabel={itemLabel} onCreate={onCreate} />
            <DeleteItem
              item={item}
              setItem={setItem}
              table={table}
              itemLabel={itemLabel}
              onDelete={onDelete}
            />
          </Button.Group>

          <Container style={{ marginTop: "30px", overflow: "auto", width: "800px" }}>
            <DataTable
              table={table}
              columns={columns}
              searchColumn="name"
              idColumn="id"
              setSelected={setItem}
              reverse={reverse}
            />
          </Container>
        </Segment>
      </Grid.Column>
    </Grid>
  );
};

const CreateItem = ({ setItem, table, itemLabel, onCreate }) => {
  const [status, setStatus] = useState("inactive");
  const [itemName, setItemName] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();

    setItemName(itemName.trim());
    setStatus("pending");

    try {
      db.idb
        .table(table)
        .add({
          name: itemName,
        })
        .then((id) => {
          if (onCreate) onCreate(id);
          setItem({ id, name: itemName });
        });
      setStatus("inactive");
    } catch (e) {
      console.log(e);
      setStatus("error");
    }
  };

  return (
    <Modal
      as={Form}
      trigger={
        <Button>
          <Icon name="plus" />
          Create {itemLabel}
        </Button>
      }
      onSubmit={(e) => onSubmit(e)}
      open={status !== "inactive"}
      onClose={() => setStatus("inactive")}
      onOpen={() => {
        setItemName("");
        setStatus("awaiting input");
      }}
      size="tiny"
    >
      <Header icon="pencil" content="Create new Item" as="h2" />
      <Modal.Content>
        <Form.Group>
          <Form.Input
            width={12}
            label="Name"
            required
            type="text"
            value={itemName}
            onChange={(e, d) => {
              setStatus("awaiting input");
              setItemName(d.value);
            }}
            placeholder="Enter name"
          />
        </Form.Group>
      </Modal.Content>
      <Modal.Actions>
        {status === "error" ? (
          <div>Could not create item for a reason not yet covered in the error handling...</div>
        ) : null}
        {status === "pending" ? (
          <Dimmer active inverted>
            <Loader content="Creating item" />
          </Dimmer>
        ) : (
          <Button type="submit" color="green" icon="save" content="Create" />
        )}
      </Modal.Actions>
    </Modal>
  );
};

const DeleteItem = ({ item, setItem, table, itemLabel, onDelete }) => {
  const [status, setStatus] = useState("inactive");

  const onSubmit = async (event) => {
    setStatus("pending");
    try {
      if (onDelete) await onDelete(item.id);
      await db.idb.table(table).where("id").equals(item.id).delete();
      setItem(null);

      setStatus("inactive");
    } catch (e) {
      setStatus("error");
    }
  };

  if (!item?.id) return null;

  return (
    <Modal
      closeIcon
      open={status !== "inactive"}
      trigger={
        <Button compact>
          <Icon name="minus" /> Delete {itemLabel}
        </Button>
      }
      onClose={() => {
        setStatus("inactive");
      }}
      onOpen={() => {
        setStatus("awaiting input");
      }}
    >
      <Header icon="trash" content={`Delete item ${item.name}`} />
      <Modal.Content>
        <p>Do you really want to delete this item?</p>
      </Modal.Content>
      <Modal.Actions>
        {status === "error" ? (
          <div>Could not delete item for a reason not yet covered in the error handling...</div>
        ) : null}
        {status === "pending" ? (
          <Dimmer active inverted>
            <Loader content="Deleting item" />
          </Dimmer>
        ) : (
          <>
            <Button
              color="red"
              onClick={() => {
                setStatus("inactive");
              }}
            >
              <Icon name="remove" /> No
            </Button>
            <Button color="green" onClick={onSubmit}>
              <Icon name="checkmark" /> Yes
            </Button>
          </>
        )}
      </Modal.Actions>
    </Modal>
  );
};

export default React.memo(DexieTableManager);
