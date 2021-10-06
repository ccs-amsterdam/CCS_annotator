import Axios from "axios";

export default async function newAmcatSession(host, email, password) {
  const response = await Axios.get(`${host}/auth/token/`, {
    auth: { username: email, password: password },
  });
  return new Amcat(host, email, response.data.token);
}

class Amcat {
  constructor(host, email, token) {
    this.host = host;
    this.email = email;
    this.api = Axios.create({
      baseURL: host,
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
