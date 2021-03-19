import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Dropdown, Grid } from "semantic-ui-react";
import AmcatIndexSelector from "./AmcatIndexSelector";
import AnnotationText from "./AnnotationText";
import SpanGroups from "./SpanGroups";

const Annotate = () => {
  const amcat = useSelector((state) => state.amcat);
  const amcatIndex = useSelector((state) => state.amcatIndex);
  const [text, setText] = useState(null);
  const [articleList, setArticleList] = useState([]);

  useEffect(() => {
    if (amcat && amcatIndex) {
      const fields = ["date", "title", "url", "text"];
      amcat
        .getQuery(amcatIndex.name, "", fields, "2m", 100, {})
        .then((res) => {
          setArticleList(res.data.results);
        })
        .catch((e) => {
          console.log(e);
        });
    }
  }, [amcat, amcatIndex]);

  const getArticleOptions = (articles) => {
    const items = articles.map((article, i) => {
      return { key: i, text: article.title, value: article.text };
    });
    return items;
  };

  return (
    <>
      <Grid>
        <Grid.Row>
          <AmcatIndexSelector type="dropdown" />
          <Dropdown
            selection
            onChange={(e, d) => {
              setText(d.value);
            }}
            options={getArticleOptions(articleList)}
          />
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={12}>
            <AnnotationText text={text ? text : null} />
          </Grid.Column>
          <Grid.Column width={4}>
            <SpanGroups />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </>
  );
};

export default Annotate;
