const TOKEN_ENDPOINT = "https://onitools.moe/_matsurisu_panic_auth/token";
const TWEET_ENDPOINT = "https://onitools.moe/_matsurisu_panic_auth/tweet";

let userAuth;

export default function sendTweet(
  message,
  imageData,
  score,
  successCallback,
  errorCallback
) {
  const tweetData = { message, imageData };

  let twitterAuthWindow, twitterAuthWindowInterval;

  const wrappedSuccessCallback = (data) => {
    if (successCallback !== undefined && successCallback !== null)
      successCallback(data);
  };
  const wrappedErrorCallback = (data) => {
    clearInterval(twitterAuthWindowInterval);
    if (errorCallback !== undefined && errorCallback !== null)
      errorCallback(data);
  };

  function postTweet(auth) {
    fetch(TWEET_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({ auth: auth, data: tweetData, score: score }),
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
        clearInterval(twitterAuthWindowInterval);
        twitterAuthWindow?.close();
        wrappedSuccessCallback(json);
      })
      .catch(wrappedErrorCallback);
  }

  if (userAuth !== undefined) return postTweet(userAuth);

  // Callback for after twitter login
  function finishTweetProcess(event) {
    if (!event.origin.startsWith("https://onitools.moe")) {
      return;
    }

    const auth = event.data;
    console.log(auth);
    userAuth = auth;

    postTweet(auth);

    window.removeEventListener("message", finishTweetProcess);
  }

  // Function to open login with Twitter window after initial token retrieval
  function openTwitterAuthWindow(oauth_token) {
    twitterAuthWindow = window.open(
      `https://api.twitter.com/oauth/authenticate?oauth_token=${oauth_token}`,
      "Sign in with Twitter",
      "left=100,top=100,width=400,height=400"
    );

    twitterAuthWindowInterval = setInterval(() => {
      if (twitterAuthWindow.closed) {
        wrappedErrorCallback(new Error("Popup closed before authentication."));
      }
    }, 100);
  }

  window.addEventListener("message", finishTweetProcess);

  // Actually begin tweet process
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
      console.log("oauth_token", json.oauth_token);
      openTwitterAuthWindow(json.oauth_token);
    })
    .catch(wrappedErrorCallback);
}