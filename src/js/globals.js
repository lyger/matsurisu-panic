export const WIDTH = 720;
export const HEIGHT = 1280;
export const PLAYERHEIGHT = 820;
export const GROUNDHEIGHT = 950;

export const DEPTH = {
  BGBACK: 0,
  BGFRONT: 10,
  OBJECTBACK: 30,
  PLAYERDEPTH: 50,
  OBJECTDEPTH: 60,
  UIBACK: 80,
  UIFRONT: 100,
};

export const PUBLIC_PATH = "/matsurisu-panic";

export const TEXT_STYLE = {
  fontFamily: "Gen Jyuu Gothic P Heavy, sans-serif",
  fontSize: "30px",
  color: "#ffc13d",
  align: "center",
};

export const CATCH_MESSAGE_STYLE = {
  ...TEXT_STYLE,
  fontSize: "40px",
  shadow: { offsetX: 2, offsetY: 2, color: "#182538", fill: true },
};

export const RESULTS_TEXT_STYLE = {
  ...TEXT_STYLE,
  fontSize: "24px",
  color: "#56301b",
};

export const CURTAIN_COLOR_1 = 0xfc5d51;
export const CURTAIN_COLOR_2 = 0xff4e47;

export const MSG = {
  CONFIRM_TWEET: { en: "Send tweet?", jp: "ツイートしますか？" },
  TWEET: {
    en: "I scored [SCORE] points! #TestHashtag",
    jp: "[SCORE]点を達成しました！ #テストハッシュタグ",
  },
  TWEET_PROGRESS: { en: "Sending...", jp: "送信中…" },
  TWEET_SUCCESS: { en: "Tweet sent!", jp: "ツイート成功！" },
  TWEET_FAILURE: {
    en: "Failed to send tweet!",
    jp: "ツイートを送信できませんでした",
  },
};
