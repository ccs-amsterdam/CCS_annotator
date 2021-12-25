import React, { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import { useCookies } from "react-cookie";
import Backend from "./lib/Backend";

const useBackend = (host) => {
  const [cookies, setCookies] = useCookies(["backend"]);
  const [backend, setBackend] = useState(null);

  useEffect(() => {
    if (backend?.host !== host) setBackend(null);
    if (backend || !host || !cookies?.backend?.token) return;
    logIn(cookies, setCookies, setBackend);
  }, [cookies, backend, host, setCookies, setBackend]);

  //const loginForm = !host ? null : <LoginForm host={host} />;
  return [backend, <LoginForm host={host} />];
};

const logIn = async (cookies, setCookies, setBackend) => {
  const backend = new Backend(cookies?.backend?.host, cookies?.backend?.token);
  try {
    // maybe add check for specific user later. For now just check if can get token
    await backend.getToken();
    setBackend(backend);
  } catch (e) {
    console.log(e);
    setCookies("backend", JSON.stringify({ ...backend, token: null }), { path: "/" });
  }
};

export default useBackend;
