import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Grid,
  Form,
  Container,
  Button,
  Icon,
  Segment,
} from "semantic-ui-react";
import SelectionTable from "./SelectionTable";
import { setArticles } from "../Actions";

const articleTableColumns = [
  { Header: "ID", accessor: "id", headerClass: "two wide" },
  { Header: "Date", accessor: "date", headerClass: "six wide" },
  { Header: "Title", accessor: "title", headerClass: "eight wide" },
];

//const data = [{ id: 777, date: "2010-01-01", title: "James Bond on Ice" }];

const QueryForm = () => {
  const session = useSelector((state) => state.session);
  const index = useSelector((state) => state.index);
  const articles = useSelector((state) => state.articles);
  const dispatch = useDispatch();

  const [query, setQuery] = useState("");

  const [selectedRow, setSelectedRow] = useState(null);

  const onSubmit = () => {
    const fields = ["date", "title", "url"];

    session
      .getQuery(index.name, query, fields, "2m", 100, {})
      .then((res) => {
        console.log(res.data.results);
        dispatch(setArticles(res.data.results));
      })
      .catch((e) => {
        console.log(e);
      });
  };

  if (!index) return null;

  return (
    <Grid>
      <Grid.Row>
        <Container>
          <Button.Group widths="2">
            <Button primary type="submit" onClick={onSubmit}>
              <Icon name="search" />
              Search
            </Button>
          </Button.Group>
          <Segment style={{ border: "0" }}>
            <Form>
              <Form.Group>
                <Form.TextArea
                  width={16}
                  onChange={(e, d) => setQuery(d.value)}
                />
              </Form.Group>
            </Form>
          </Segment>
        </Container>
      </Grid.Row>
      <Grid.Row>
        <SelectionTable
          columns={articleTableColumns}
          data={articles}
          selectedRow={selectedRow}
          setSelectedRow={setSelectedRow}
          defaultSize={15}
        />
      </Grid.Row>
    </Grid>
  );
};

export default QueryForm;
