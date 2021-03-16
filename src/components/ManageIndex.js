import React, { useState, useEffect } from "react";
import { Container } from "semantic-ui-react";

const ManageIndex = ({ amcat, selectedRow }) => {
  const [indexMeta, setIndexMeta] = useState(null);
  const [indexFields, setIndexFields] = useState(null);

  useEffect(() => {
    if (selectedRow && amcat) {
      amcat.getIndex(selectedRow.name).then((res) => {
        setIndexMeta(res.data);
      });
      amcat.getFields(selectedRow.name).then((res) => {
        console.log(res.data);
        setIndexFields(res.data);
      });
    } else {
      setIndexMeta(null);
      setIndexFields(null);
    }
  }, [amcat, selectedRow]);

  return (
    <Container>
      getIndex: {indexMeta ? Object.keys(indexMeta).join(" ") : null}
      <br />
      getIndexFields: {indexFields ? Object.keys(indexFields).join(" ") : null}
      <br />
      getIndexFields: {indexFields ? Object.keys(indexFields).join(" ") : null}
    </Container>
  );
};

export default ManageIndex;
