const TOKEN_ENDPOINT = "https://onitools.moe/_matsurisu_panic_auth/token";
const TWEET_ENDPOINT = "https://onitools.moe/_matsurisu_panic_auth/tweet";

const TwitterManager = {
  userAuth: null,
  authWindow: null,
  authWindowInterval: null,
  authListener: null,
  errorCallback: null,

  get isAuthorized() {
    return this.userAuth !== null;
  },

  setErrorCallback(callback) {
    this.errorCallback = callback;
  },

  clearErrorCallback() {
    this.errorCallback = null;
  },

  cleanup() {
    window.removeEventListener("message", this.authListener);
    clearInterval(this.authWindowInterval);
  },

  handleError(err) {
    this.cleanup();
    this.errorCallback?.(err);
  },

  initialize(onSuccess) {
    fetch(TOKEN_ENDPOINT)
      .then((response) => {
        if (!response.ok)
          throw new Error(
            `Token fetch returned response code ${response.status}`
          );
        return response.json();
      })
      .then((json) => {
        if (json.status !== 200) throw new Error(json.error_message);
        onSuccess?.(json.oauth_token);
      })
      .catch(this.handleError.bind(this));
  },

  authorizeAndTweet({
    oauthToken,
    message,
    imageData,
    score,
    endless = false,
    onSuccess,
  }) {
    this.authListener = (event) => {
      if (!event.origin.startsWith("https://onitools.moe")) {
        return;
      }
      this.cleanup();
      this.userAuth = event.data;
      this.tweet({ message, imageData, score, endless, onSuccess });
    };

    window.addEventListener("message", this.authListener);

    this.authWindow = window.open(
      `https://api.twitter.com/oauth/authenticate?oauth_token=${oauthToken}`,
      "Sign in with Twitter",
      "left=100,top=100,width=400,height=400"
    );

    this.authWindowInterval = setInterval(() => {
      if (
        this.authWindow === null ||
        this.authWindow === undefined ||
        this.authWindow.closed ||
        this.authWindow.closed === undefined
      )
        this.handleError(new Error("Popup closed before authentication."));
    }, 100);
  },

  tweet({ message, imageData, score, endless = false, onSuccess }) {
    fetch(TWEET_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({
        auth: this.userAuth,
        data: { message, imageData },
        score,
        endless,
      }),
    })
      .then((response) => {
        if (!response.ok)
          throw new Error(
            `Tweet post returned response code ${response.status}`
          );
        return response.json();
      })
      .then((json) => {
        if (json.status !== 200) throw new Error(json.error_message);
        this.cleanup();
        this.authWindow?.postMessage("done", "*");
        this.authWindow?.close();
        onSuccess?.(json);
      })
      .catch(this.handleError.bind(this));
  },
};

export default TwitterManager;
