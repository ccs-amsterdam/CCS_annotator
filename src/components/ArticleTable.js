import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import SelectionTable from "./SelectionTable";
import { selectArticle } from "../Actions";

const articleTableColumns = [
  { Header: "ID", accessor: "id", headerClass: "two wide" },
  { Header: "Date", accessor: "date", headerClass: "six wide" },
  { Header: "Title", accessor: "title", headerClass: "eight wide" },
];

const ArticleTable = () => {
  const amcatIndex = useSelector((state) => state.amcatIndex);
  const article = useSelector((state) => state.article);
  const articles = useSelector((state) => state.articles);
  const dispatch = useDispatch();

  const [selectedRow, setSelectedRow] = useState(article);

  useEffect(() => {
    dispatch(selectArticle(selectedRow));
  }, [selectedRow, dispatch]);

  if (!amcatIndex) return null;

  return (
    <SelectionTable
      columns={articleTableColumns}
      data={articles}
      selectedRow={selectedRow}
      setSelectedRow={setSelectedRow}
      defaultSize={15}
    />
  );
};

export default ArticleTable;
