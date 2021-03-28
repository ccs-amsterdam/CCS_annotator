import { Dropbox, DropboxAuth } from "dropbox";
import queryString from "query-string";

// this is just a simple wrapper around Dropbox that gives access
// to just the methods that we need and in a format that we might
// reuse with a different api
export default class DropboxAPI {
  constructor(dbx, user) {
    this.dbx = dbx;
    this.user = user;
  }

  readJSON(filepath) {
    this.dbx.filesDownload({
      path: `/${this.user.email}/${filepath}`,
    });
  }

  writeJSON(data_array, filepath) {
    const file = new File(data_array, filepath, {
      type: "application/json",
    });
    this.dbx.filesUpload({
      path: `/${this.user.email}/${file.name}`,
      contents: file,
    });
  }
}

export const makeConnection = async (dbxAuth, token) => {
  dbxAuth.setAccessToken(token);
  const dbx = new Dropbox({ auth: dbxAuth });
  const user = await dbx.usersGetCurrentAccount();
  return new DropboxAPI(dbx, user.result);
};

export const getDropboxAuth = (clientID) => {
  return new DropboxAuth({
    clientId: clientID,
  });
};

export const getCodeFromDropbox = (dbxAuth, redirectURL) => {
  dbxAuth
    .getAuthenticationUrl(
      redirectURL,
      undefined,
      "code",
      "offline",
      undefined,
      undefined,
      true
    )
    .then((authUrl) => {
      window.sessionStorage.clear();
      window.sessionStorage.setItem("codeVerifier", dbxAuth.codeVerifier);
      window.location.href = authUrl;
    })
    .catch((error) => console.error(error));
};

export const getCodeFromUrl = () => {
  // the dropbox code is returned as the 'code' query param.
  return queryString.parse(window.location.search).code;
};

export const getAuthToken = async (dbxAuth, code, redirectURL) => {
  // PKCE authentication
  const codeVerifier = window.sessionStorage.getItem("codeVerifier");
  dbxAuth.setCodeVerifier(codeVerifier);
  await dbxAuth.generateCodeChallenge();
  const token = await dbxAuth.getAccessTokenFromCode(redirectURL, code);
  return {
    token: token.result.access_token,
    refresh_token: token.result.refresh_token,
    expiration_date: Date.now() + token.result.expires_in * 1000,
  };
};
