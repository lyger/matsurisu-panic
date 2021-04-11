const privateState = {
  tweetData: null,
  successCallback: null,
  errorCallback: null,
  twitterAuthWindow: null,
  twitterAuthWindowInterval: null,
};

const TOKEN_ENDPOINT = "https://onitools.moe/_matsurisu_panic_auth/token";
const TWEET_ENDPOINT = "https://onitools.moe/_matsurisu_panic_auth/tweet";

function openTwitterAuthWindow(oauth_token) {
  const twitterAuthWindow = window.open(
    `https://api.twitter.com/oauth/authenticate?oauth_token=${oauth_token}`,
    "Sign in with Twitter",
    "left=100,top=100,width=400,height=400"
  );

  privateState.twitterAuthWindow = twitterAuthWindow;
  privateState.twitterAuthWindowInterval = setInterval(() => {
    if (twitterAuthWindow.closed) {
      clearInterval(privateState.twitterAuthWindowInterval);
      if (privateState.errorCallback !== null)
        privateState.errorCallback(
          new Error("Popup closed before authentication.")
        );
    }
  }, 100);
}

export default function sendTweet(
  message,
  imageData,
  successCallback,
  errorCallback
) {
  const tweetData = { message, imageData };

  privateState.tweetData = tweetData;
  privateState.successCallback = successCallback;
  privateState.errorCallback = errorCallback;

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
      openTwitterAuthWindow(json.oauth_token);
    })
    .catch((err) => errorCallback(err));
}

function finishTweetProcess(auth) {
  const {
    errorCallback,
    successCallback,
    tweetData,
    twitterAuthWindow,
    twitterAuthWindowInterval,
  } = privateState;

  fetch(TWEET_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({ auth: auth, data: tweetData }),
  })
    .then((response) => {
      if (!response.ok)
        throw new Error(`Tweet post returned response code ${response.status}`);
      return response.json();
    })
    .then((json) => {
      if (json.status !== 200) throw new Error(json.error_message);
      clearInterval(twitterAuthWindowInterval);
      twitterAuthWindow.close();
      successCallback(json);
    })
    .catch((err) => errorCallback(err));
}

window.addEventListener("message", (event) => {
  if (!event.origin.startsWith("https://onitools.moe")) {
    return;
  }
  finishTweetProcess(event.data);
});
