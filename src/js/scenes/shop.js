import Phaser from "phaser";
import DebugCursor from "../components/debugcursor";
import { getShopItems } from "../components/items/catalog";
import Scoreboard from "../components/scoreboard";
import ButtonFactory from "../components/uibutton";
import { DEPTH, HEIGHT, TEXT_STYLE, WIDTH } from "../globals";
import store from "../store";
import { addCurtainsTransition } from "./curtains";
import Stage from "./stage";

const BROWN_TEXT_STYLE = { ...TEXT_STYLE, color: "#56301b", fontSize: "20px" };
const BROWN_TEXT_STYLE_LARGE = { ...BROWN_TEXT_STYLE, fontSize: "30px" };
const BROWN_TEXT_STYLE_LARGEST = { ...BROWN_TEXT_STYLE, fontSize: "40px" };

const ShopConfirmButton = ButtonFactory("shop-confirm-buttons", true);

class ShopConfirmModal extends Phaser.Scene {
  create({ item, buyCallback }) {
    const cover = this.add
      .rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.5)
      .setDepth(DEPTH.BGBACK)
      .setInteractive();
    cover.on("pointerdown", this.returnToShop, this);
    this.add
      .image(WIDTH / 2, HEIGHT / 2, "shop-confirm-modal")
      .setDepth(DEPTH.UIBACK)
      .setOrigin(0.5, 0.5);

    const state = store.getState();
    const currentPowerup = state.player.powerup;
    const currentMoney = state.score.money;
    const newMoney = currentMoney - item.price;

    this.add
      .text(
        230,
        695,
        currentMoney.toLocaleString("en-US"),
        BROWN_TEXT_STYLE_LARGEST
      )
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);
    this.add
      .text(
        490,
        695,
        newMoney.toLocaleString("en-US"),
        BROWN_TEXT_STYLE_LARGEST
      )
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);
    this.add
      .image(WIDTH / 2, 695, "shop-confirm-arrow")
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);

    if (item.type === "powerup" && currentPowerup !== null) {
      this.add
        .text(WIDTH / 2, 475, "Change?", BROWN_TEXT_STYLE_LARGEST)
        .setOrigin(0.5, 0.5)
        .setDepth(DEPTH.UIFRONT);
      this.add
        .image(230, 570, currentPowerup.texture, currentPowerup.frame)
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(0.5, 0.5);
      this.add
        .image(WIDTH / 2, 570, "shop-confirm-arrow")
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(0.5, 0.5);
      this.add
        .image(490, 570, item.texture, item.frame)
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(0.5, 0.5);
    } else {
      this.add
        .text(WIDTH / 2, 475, "Buy?", BROWN_TEXT_STYLE_LARGEST)
        .setOrigin(0.5, 0.5)
        .setDepth(DEPTH.UIFRONT);
      this.add
        .image(WIDTH / 2, 570, item.texture, item.frame)
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(0.5, 0.5);
    }

    this.buttonNo = new ShopConfirmButton(this, {
      x: 230,
      y: 820,
      default: 0,
      over: 1,
      down: 1,
      downCallback: () => this.returnToShop(),
    });

    this.buttonYes = new ShopConfirmButton(this, {
      x: 490,
      y: 820,
      default: 2,
      over: 3,
      down: 3,
      downCallback: () => {
        buyCallback();
        this.returnToShop();
      },
    });

    this.add.existing(this.buttonNo);
    this.add.existing(this.buttonYes);
  }

  returnToShop() {
    this.scene.resume("Shop");
    this.scene.remove(this.scene.key);
  }
}

const ShopButton = ButtonFactory("shop-done-buttons", true);

export default class Shop extends Phaser.Scene {
  create() {
    this.bgm = this.sound.add("matsuri-jazz", {
      loop: true,
      volume: 0.5,
    });
    this.bgm.play();

    this.background = this.add.image(WIDTH / 2, HEIGHT / 2, "shop-background");
    const shopItems = getShopItems();
    this.items = shopItems.map((item) => item.addToShop(this));
    Phaser.Actions.GridAlign(this.items, {
      x: 191,
      y: 252,
      width: 2,
      height: 3,
      cellWidth: 334,
      cellHeight: 322,
      position: Phaser.Display.Align.CENTER,
    });

    this.createScoreboard();

    this.events.on("shop.confirmPurchase", (itemIcon) => {
      const item = itemIcon.item;
      const buyCallback = () => {
        item.buy(this);
        this.items.splice(this.items.indexOf(itemIcon), 1);
        itemIcon.destroy();
        this.refreshState();
      };
      this.scene.pause(this.scene.key);
      this.scene.add("ShopConfirmModal", ShopConfirmModal, true, {
        item,
        buyCallback,
      });
    });

    this.itemLabel = this.add
      .text(WIDTH / 2, 945, "ITEM", { ...TEXT_STYLE, color: "#ffffff" })
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);
    this.itemIcon = null;

    this.doneButton = new ShopButton(this, {
      x: WIDTH / 2,
      y: 1195,
      default: 0,
      over: 1,
      downCallback: () => this.doneShopping(),
    });

    this.add.existing(this.doneButton);

    this.refreshState();
  }

  createScoreboard() {
    this.scoreLabel = this.add
      .text(142, 767, "SCORE", BROWN_TEXT_STYLE)
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);
    this.levelLabel = this.add
      .text(66, 838, "Lv", BROWN_TEXT_STYLE)
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);
    this.moneyLabel = this.add
      .text(520, 778, "MONEY", { ...BROWN_TEXT_STYLE, fontSize: "35px" })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);

    this.scoreText = this.add
      .text(142, 798, "0", BROWN_TEXT_STYLE_LARGE)
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);
    this.levelText = this.add
      .text(66, 865, "0", BROWN_TEXT_STYLE_LARGE)
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);
    this.moneyText = this.add
      .text(670, 845, "0", { ...BROWN_TEXT_STYLE, fontSize: "55px" })
      .setOrigin(1, 0.5)
      .setDepth(DEPTH.UIFRONT);

    this.livesTop = this.add.group();
    this.livesBot = this.add.group();
  }

  refreshState() {
    const state = store.getState();
    const { money } = state.score;
    const { powerup } = state.player;
    if (powerup !== null) {
      if (this.itemIcon !== null) this.itemIcon.destroy();
      this.itemIcon = this.add
        .image(WIDTH / 2, 1035, powerup.texture, powerup.frame)
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(0.5, 0.5);
    }

    this.items.forEach((itemIcon) => {
      const item = itemIcon.item;
      if (item.price > money) {
        itemIcon.setCannotBuy();
      }
    });

    this.refreshScoreboard(state);
    this.refreshLives(state);
  }

  refreshScoreboard(state) {
    this.scoreText.setText(`${state.score.score}`);
    this.levelText.setText(`${state.stage.level}`);
    this.moneyText.setText(state.score.money.toLocaleString("en-US"));
  }

  refreshLives(state) {
    const numLivesTop = Math.min(state.score.lives, 5);
    const numLivesBot = Math.max(state.score.lives - 5, 0);

    this.livesTop.clear(true, true);
    this.livesBot.clear(true, true);

    this.livesTop.createMultiple({
      key: "stage-scoreboard-life",
      quantity: numLivesTop,
      setXY: {
        x: 109,
        y: 842,
        stepX: 26.3,
      },
      setOrigin: {
        x: 0.5,
        y: 0.5,
      },
      setDepth: { value: DEPTH.UIFRONT },
    });

    if (numLivesBot < 1) return;
    this.livesBot.createMultiple({
      key: "stage-scoreboard-life",
      quantity: numLivesBot,
      setXY: {
        x: 122,
        y: 869,
        stepX: 26.3,
      },
      setOrigin: {
        x: 0.5,
        y: 0.5,
      },
      setDepth: { value: DEPTH.UIFRONT },
    });
    return this;
  }

  fadeBgm(duration) {
    this.tweens.add({
      targets: this.bgm,
      volume: 0.0,
      duration,
      onComplete: () => this.bgm.destroy(),
    });
  }

  doneShopping() {
    this.fadeBgm(1000);
    addCurtainsTransition({
      scene: this,
      targetKey: "Stage",
      targetClass: Stage,
      duration: 1000,
    });
  }
}
