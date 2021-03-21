import React, { useState } from "react";
import ReactDOM from "react-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Button, Container, Icon } from "semantic-ui-react";

// Based on: https://codesandbox.io/s/-w5szl?file=/src/index.js
// not used for now, but might implement in time in 'code manager'

// fake data generator
const getItems = (count, offset = 0) =>
  Array.from({ length: count }, (v, k) => k).map((k) => ({
    id: `item-${k + offset}-${new Date().getTime()}`,
    content: `item ${k + offset}`,
  }));

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

/**
 * Moves an item from one list to another list.
 */
const move = (source, destination, droppableSource, droppableDestination) => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(droppableSource.index, 1);

  destClone.splice(droppableDestination.index, 0, removed);

  const result = {};
  result[droppableSource.droppableId] = sourceClone;
  result[droppableDestination.droppableId] = destClone;

  return result;
};

const grid = 8;

function QuoteApp() {
  const [state, setState] = useState([getItems(10), getItems(5, 10)]);

  function onDragEnd(result) {
    const { source, destination } = result;

    // dropped outside the list
    if (!destination) {
      return;
    }
    const sInd = +source.droppableId;
    const dInd = +destination.droppableId;

    if (sInd === dInd) {
      const items = reorder(state[sInd], source.index, destination.index);
      const newState = [...state];
      newState[sInd] = items;
      setState(newState);
    } else {
      const result = move(state[sInd], state[dInd], source, destination);
      const newState = [...state];
      newState[sInd] = result[sInd];
      newState[dInd] = result[dInd];

      setState(newState.filter((group) => group.length));
    }
  }

  const createDraggable = (item, index, ind) => {
    return (
      <Draggable key={item.id} draggableId={item.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
              }}
            >
              {item.content}
              <Button
                icon
                size="small"
                type="button"
                onClick={() => {
                  const newState = [...state];
                  newState[ind].splice(index, 1);
                  setState(newState.filter((group) => group.length));
                }}
              >
                <Icon name="trash" />
              </Button>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  const mapItems = () => {
    return state.map((el, ind) => (
      <Droppable key={ind} droppableId={`${ind}`}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef}>
            {el.map((item, index) => createDraggable(item, index, ind))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    ));
  };

  return (
    <div>
      <Button
        type="button"
        onClick={() => {
          setState([...state, []]);
        }}
      >
        Add Cluster
      </Button>

      <div style={{ display: "flex" }}>
        <DragDropContext onDragEnd={onDragEnd}>{mapItems()}</DragDropContext>
      </div>
    </div>
  );
}

export default QuoteApp;
