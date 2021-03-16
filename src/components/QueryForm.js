import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Form, Container, Button, Icon, Segment } from "semantic-ui-react";
import { setArticles } from "../Actions";

//const data = [{ id: 777, date: "2010-01-01", title: "James Bond on Ice" }];

const QueryForm = () => {
  const amcat = useSelector((state) => state.amcat);
  const amcatIndex = useSelector((state) => state.amcatIndex);
  const dispatch = useDispatch();

  const [query, setQuery] = useState("");

  const onSubmit = () => {
    const fields = ["date", "title", "url"];

    amcat
      .getQuery(amcatIndex.name, query, fields, "2m", 100, {})
      .then((res) => {
        console.log(res.data.results);
        dispatch(setArticles(res.data.results));
      })
      .catch((e) => {
        console.log(e);
      });
  };

  if (!amcatIndex) return null;

  return (
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
            <Form.TextArea width={16} onChange={(e, d) => setQuery(d.value)} />
          </Form.Group>
        </Form>
      </Segment>
    </Container>
  );
};

export default QueryForm;
