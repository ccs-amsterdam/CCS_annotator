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

  // GET
  getIndices() {
    return this.api.get(`/index/`);
  }
  getIndex(index) {
    return this.api.get(`/index/${index}`);
  }
  getFields(index) {
    return this.api.get(`/index/${index}/fields`);
  }
  getFieldValues(index, field) {
    return this.api.get(`/index/${index}/fields/${field}/values`);
  }
  getDocument(index, doc_id) {
    return this.api.get(`/index/${index}/documents/${doc_id}`);
  }
  getQuery(index, q, fields, scroll = "2m", per_page = 100, params = {}) {
    params["scroll"] = scroll; // for scrolling, update with id obtained from results.meta.scroll_id
    params["per_page"] = per_page;
    if (fields) params["fields"] = fields.join(",");
    if (q) params["q"] = q;
    return this.api.get(`/index/${index}/query`, { params });
  }

  // POST
  createIndex(name, guestRole = "NONE") {
    const body = { name: name };
    if (guestRole !== "NONE") body.guest_role = guestRole;
    return this.api.post(`/index/`, body);
  }
  createDocuments(name, documentList) {
    // documentList should be an array of objects with at least the fields title, date and text
    return this.api.post(`/index/${name}/documents`, documentList);
  }

  // DELETE
  deleteIndex(index) {
    return this.api.delete(`/index/${index}`);
  }
}
