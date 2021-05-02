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

export const CURTAIN_COLOR_1 = 0xfc5d51;
export const CURTAIN_COLOR_2 = 0xff4e47;