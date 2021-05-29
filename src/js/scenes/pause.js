import ButtonFactory from "../components/uibutton";
import { WIDTH, TEXT_STYLE, DEPTH } from "../globals";
import store from "../store";
import { BaseModal, SettingsModal } from "./modal";
import RestartProxy from "./restartproxy";
import { getMessage } from "../utils";
import Title from "./title";

const Button = ButtonFactory("pause-screen-buttons", true, {
  ...TEXT_STYLE,
  color: "#fff",
  fontSize: "36px",
});

export default class PauseScreen extends BaseModal {
  create(args) {
    super.create({
      ...args,
      popup: false,
      closeButton: false,
      closeOnCover: false,
    });
    this.add
      .image(WIDTH / 2, 400, "pause-screen-logo")
      .setDepth(DEPTH.UIFRONT)
      .setInteractive(this.input.makePixelPerfect());

    this.lock = false;
    this.debounce = true;

    this.continueButton = new Button(this, {
      x: WIDTH / 2,
      y: 600,
      text: getMessage("PAUSE_CONTINUE"),
      base: 0,
      over: 1,
      overTextStyle: { color: "#7f7f7f" },
      overSound: "menu-click",
      downSound: "menu-click",
      keys: ["esc"],
      upCallback: () => this.handleContinue(),
    });
    this.restartButton = new Button(this, {
      x: WIDTH / 2,
      y: 710,
      text: getMessage("PAUSE_RESTART"),
      base: 2,
      over: 3,
      overTextStyle: { color: "#7f7f7f" },
      overSound: "menu-click",
      downSound: "menu-click",
      upCallback: () => this.handleNewGame(),
    });
    this.mainButton = new Button(this, {
      x: WIDTH / 2,
      y: 820,
      text: getMessage("PAUSE_MAIN"),
      base: 2,
      over: 3,
      overTextStyle: { color: "#7f7f7f" },
      overSound: "menu-click",
      downSound: "menu-click",
      upCallback: () => this.handleMainMenu(),
    });
    this.settingsButton = new Button(this, {
      x: WIDTH / 2,
      y: 930,
      text: getMessage("PAUSE_SETTINGS"),
      base: 2,
      over: 3,
      overTextStyle: { color: "#7f7f7f" },
      overSound: "menu-click",
      upCallback: () => this.handleSettings(),
    });

    this.events.on("rerender", this.refreshDisplay, this);
    this.events.on("resume", () => (this.lock = false));
    this.events.on("transitionout", () =>
      this.scene.get("Stage").events.emit("transitionout")
    );

    this.time.delayedCall(300, () => (this.debounce = false));
  }

  handleContinue() {
    if (this.lock || this.debounce) return;
    this.lock = true;
    this.returnToParent();
  }

  handleNewGame() {
    if (this.lock) return;
    this.lock = true;
    const stageScene = this.scene.get("Stage");
    this.tweens.add({
      targets: stageScene.bgm,
      volume: 0.0,
      duration: 900,
      onComplete: () => stageScene.bgm.stop(),
    });
    this.events.once("destroy", () => {
      stageScene.scene.remove("Stage");
    });
    const isEndless = store.getState().stage.isEndless;
    store.dispatch({ type: "global.newGame" });
    if (isEndless) store.dispatch({ type: "global.activateEndless" });
    this.curtainsTo("RestartProxy", RestartProxy);
  }

  handleMainMenu() {
    if (this.lock) return;
    this.lock = true;
    const stageScene = this.scene.get("Stage");
    this.tweens.add({
      targets: stageScene.bgm,
      volume: 0.0,
      duration: 900,
      onComplete: () => stageScene.bgm.stop(),
    });
    this.events.once("destroy", () => {
      stageScene.scene.remove("Stage");
    });
    this.curtainsTo("Title", Title);
  }

  handleSettings() {
    if (this.lock) return;
    this.lock = true;
    this.scene.pause();
    this.scene.add("SettingsModal", SettingsModal, true, {
      parentSceneKey: this.scene.key,
      closeOnCover: false,
    });
  }

  refreshDisplay() {
    this.continueButton.setText(getMessage("PAUSE_CONTINUE"));
    this.restartButton.setText(getMessage("PAUSE_RESTART"));
    this.mainButton.setText(getMessage("PAUSE_MAIN"));
    this.settingsButton.setText(getMessage("PAUSE_SETTINGS"));
  }
}
