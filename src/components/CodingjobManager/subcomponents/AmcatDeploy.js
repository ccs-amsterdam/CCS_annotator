import React, { useState, useEffect } from "react";
import { Button, Form } from "semantic-ui-react";
import db from "apis/dexie";
import { useCookies } from "react-cookie";
import newAmcatSession from "apis/amcat";
import { LoginForm } from "components/HeaderMenu/Login";

const AmcatDeploy = ({ codingjobPackage }) => {
  const [name, setName] = useState("");
  const [cookies, setCookie] = useCookies(["amcat"]);

  useEffect(() => {
    if (codingjobPackage?.name) setName(codingjobPackage.name);
  }, [codingjobPackage]);

  const deploy = async () => {
    const amcat = newAmcatSession(cookies.amcat.host, cookies.amcat.token);
    try {
      const id = await amcat.postCodingjob(codingjobPackage, name);
      const url = `${amcat.host}/codingjob/${id.data.id}`;
      db.createDeployedJob(name, url);
    } catch (e) {
      console.log(e);
      setCookie("amcat", JSON.stringify({ ...cookies.amcat, token: null }), { path: "/" });
    }
  };

  if (!cookies?.amcat?.token)
    return (
      <LoginForm
        cookies={cookies}
        setCookies={setCookie}
        setOpen={() => null}
        setLoggedIn={() => null}
      />
    );

  return (
    <div>
      <Form onSubmit={() => deploy()}>
        <Form.Input
          placeholder="Codingjob title"
          value={name}
          maxLength={30}
          onChange={(e, d) => setName(d.value)}
          autoFocus
          style={{ width: "100%" }}
        />
      </Form>
      <br />

      <Button fluid primary disabled={name.length < 5} onClick={() => deploy()}>
        {name.length < 5 ? "please use 5 characters or more" : "Upload to AmCAT"}
      </Button>
    </div>
  );
};

export default AmcatDeploy;
