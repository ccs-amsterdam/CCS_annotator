import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Dropdown, Grid } from "semantic-ui-react";
import AmcatIndexSelector from "./AmcatIndexSelector";
import ArticleTable from "./ArticleTable";
import Tokens from "./Tokens";

const Annotate = () => {
  const amcat = useSelector((state) => state.amcat);
  const amcatIndex = useSelector((state) => state.amcatIndex);
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
      return { key: i, text: article.title, value: i };
    });
    return items;
  };

  return (
    <>
      <Grid>
        <Grid.Row>
          <AmcatIndexSelector type="dropdown" />
          <Dropdown selection options={getArticleOptions(articleList)} />
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={12}></Grid.Column>
        </Grid.Row>
      </Grid>
      <Tokens text={articleList.length > 0 ? articleList[0].text : null} />
    </>
  );
};

export default Annotate;
