import Axios from "axios";

export async function getToken(host, email, password) {
  const response = await Axios.get(`${host}/auth/token/`, {
    auth: { username: email, password: password },
  });
  return response.data.token;
}

export default function newAmcatSession(host, email, token) {
  return new Amcat(host, email, token);
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

  postCodingjob(codingjobPackage, title) {
    codingjobPackage.title = title;

    return this.api.post(`/codingjob`, {
      title: title,
      units: codingjobPackage.units,
      codebook: codingjobPackage.codebook,
      provenance: codingjobPackage.provenance,
      rules: {},
    });
  }
}
