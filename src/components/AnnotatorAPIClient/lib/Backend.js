import Axios from "axios";

export async function getToken(host, email, password) {
  const response = await Axios.get(`${host}/token`, {
    auth: { username: email, password: password },
  });
  return response.data.token;
}

class Backend {
  constructor(host, token) {
    this.host = host;
    this.token = token;
    this.api = Axios.create({
      baseURL: host,
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // add init that checks token and gets info like admin
  // in usebackend.js -> login, then check by using init

  // GET
  async getToken() {
    const res = await this.api.get("/token");
    return res.data;
  }
  async getCodebook(job_id) {
    const res = await this.api.get(`/codingjob/${job_id}/codebook`);
    return res.data;
  }
  async getProgress(job_id) {
    console.log("test");
    const res = await this.api.get(`/codingjob/${job_id}/progress`);
    console.log(res);
    return res.data;
  }
  async getUnit(job_id, i) {
    let path = `/codingjob/${job_id}/unit`;
    if (i !== null) path += `?index=${i}`;
    const res = await this.api.get(path);
    return res.data;
  }
  async getCodingjob(job_id) {
    const res = await this.api.get(`/codingjob/${job_id}`);
    return res.data;
  }

  // POST
  postCodingjob(codingjobPackage, title) {
    codingjobPackage.title = title;

    return this.api.post(`/codingjob`, {
      title: title,
      units: codingjobPackage.units,
      codebook: codingjobPackage.codebook,
      provenance: codingjobPackage.provenance,
      rules: codingjobPackage.rules,
    });
  }
  postAnnotation(job_id, unit_id, annotation, status) {
    const data = { annotation, status };
    this.api.post(`/codingjob/${job_id}/unit/${unit_id}/annotation`, data);
  }
}

export default Backend;
