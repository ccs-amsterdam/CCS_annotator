import React, { useEffect, useState } from "react";
import { Accordion, Grid, Header, Icon, Label } from "semantic-ui-react";
import { useSelector } from "react-redux";
import SelectionTable from "./SelectionTable";

const CodeBook = () => {
  const codingjob = useSelector((state) => state.codingjob);
  const [codes, setCodes] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);

  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!codingjob) return null;
    if (!codingjob.codebook) {
      setCodes([]);
      return null;
    }
    const cb = JSON.parse(codingjob.codebook);
    if (cb && cb.codes) setCodes(cb.codes);
  }, [codingjob]);

  const handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const newIndex = activeIndex === index ? -1 : index;
    setActiveIndex(newIndex);
  };

  if (!codingjob) return null;

  const spanAnnotationEditor = () => {
    const tableColumns = [
      {
        Header: "Code",
        accessor: "code",
        headerClass: "thirteen wide",
      },
    ];
    return (
      <>
        <Accordion.Title
          active={activeIndex === 0}
          index={0}
          onClick={handleClick}
        >
          <Icon name="dropdown" />

          <Label color="black" content="Span Annotations"></Label>
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 0}>
          <Grid>
            <Grid.Column width={11}></Grid.Column>
            <Grid.Column width={5}>
              <Header as="h4" textAlign="center">
                Codes
              </Header>
              <SelectionTable
                columns={tableColumns}
                data={codes ? codes : []}
                selectedRow={selectedCode}
                setSelectedRow={setSelectedCode}
                defaultSize={10}
              />
            </Grid.Column>
          </Grid>
        </Accordion.Content>
      </>
    );
  };

  return <Accordion>{spanAnnotationEditor()}</Accordion>;
};

export default CodeBook;
