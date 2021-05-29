import Phaser from "phaser";
import { getShopItems } from "../components/items/catalog";
import ButtonFactory from "../components/uibutton";
import {
  DEPTH,
  HEIGHT,
  SHOP_BGM_VOLUME_FACTOR,
  TEXT_STYLE,
  WIDTH,
} from "../globals";
import store from "../store";
import { getMessage } from "../utils";
import BaseScene from "./base";
import Stage from "./stage";

const BROWN_TEXT_STYLE = { ...TEXT_STYLE, color: "#56301b", fontSize: "20px" };
const BROWN_TEXT_STYLE_LARGE = { ...BROWN_TEXT_STYLE, fontSize: "30px" };
const BROWN_TEXT_STYLE_LARGEST = { ...BROWN_TEXT_STYLE, fontSize: "40px" };

const ShopConfirmButton = ButtonFactory("shop-confirm-buttons", true);

class ShopConfirmModal extends BaseScene {
  create({ shopItem, buyCallback }) {
    const { item } = shopItem;
    this.playSoundEffect("menu-open", 0.5);
    const cover = this.add
      .rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.5)
      .setDepth(DEPTH.BGBACK)
      .setInteractive();
    cover.on("pointerdown", this.returnToShop, this);
    this.add
      .image(WIDTH / 2, HEIGHT / 2, "shop-confirm-modal")
      .setDepth(DEPTH.UIBACK)
      .setOrigin(0.5, 0.5)
      .setInteractive(this.input.makePixelPerfect());

    const state = store.getState();
    const currentPowerup = state.player.powerup;
    const currentMoney = state.score.money;
    const newMoney = currentMoney - shopItem.price;

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
        .text(
          WIDTH / 2,
          475,
          getMessage("REPLACE_ITEM"),
          BROWN_TEXT_STYLE_LARGEST
        )
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
        .text(WIDTH / 2, 475, getMessage("BUY_ITEM"), BROWN_TEXT_STYLE_LARGEST)
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
      base: 0,
      over: 1,
      down: 1,
      overSound: "menu-click",
      downSound: "menu-no",
      downSoundAdjustment: 0.5,
      downCallback: () => {
        this.returnToShop();
      },
    });

    this.buttonYes = new ShopConfirmButton(this, {
      x: 490,
      y: 820,
      base: 2,
      over: 3,
      down: 3,
      overSound: "menu-click",
      downCallback: () => {
        buyCallback();
        this.returnToShop();
      },
    });
  }

  returnToShop() {
    this.scene.resume("Shop");
    this.scene.remove(this.scene.key);
  }
}

const ShopButton = ButtonFactory("shop-done-buttons", true);

export default class Shop extends BaseScene {
  create() {
    const settings = store.getState().settings;
    this.bgm = this.sound.add("matsuri-jazz", {
      loop: true,
      volume: SHOP_BGM_VOLUME_FACTOR * settings.volumeMusic,
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

    this.events.on("shop.confirmPurchase", (shopItem) => {
      const buyCallback = () => {
        shopItem.buy(this);
        this.items.splice(this.items.indexOf(shopItem), 1);
        shopItem.destroy();
        this.refreshState();
      };
      this.scene.pause();
      this.scene.add("ShopConfirmModal", ShopConfirmModal, true, {
        shopItem,
        buyCallback,
      });
    });

    this.itemLabel = this.add
      .text(620, 945, getMessage("ITEM"), { ...TEXT_STYLE, color: "#ffffff" })
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);
    this.itemIcon = null;
    this.equipmentLabel = this.add
      .text(258, 945, getMessage("EQUIPMENT"), {
        ...TEXT_STYLE,
        color: "#ffffff",
      })
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);
    this.equipmentIcons = [];

    this.doneButton = new ShopButton(this, {
      x: WIDTH / 2,
      y: 1195,
      base: 0,
      over: 1,
      overSound: "menu-click",
      downSound: "menu-click",
      downCallback: () => this.doneShopping(),
    });

    this.events.on("destroy", () => {
      this.bgm?.stop?.();
      this.bgm?.destroy?.();
    });

    this.refreshState();
  }

  createScoreboard() {
    this.scoreLabel = this.add
      .text(165, 767, "SCORE", BROWN_TEXT_STYLE)
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);
    this.levelLabel = this.add
      .text(66, 767, "Lv", BROWN_TEXT_STYLE)
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);
    this.moneyLabel = this.add
      .text(520, 778, "MONEY", { ...BROWN_TEXT_STYLE, fontSize: "35px" })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);

    this.scoreText = this.add
      .text(165, 798, "0", BROWN_TEXT_STYLE_LARGE)
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);
    this.levelText = this.add
      .text(66, 798, "0", BROWN_TEXT_STYLE_LARGE)
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
    const { powerup, equipment } = state.player;
    const { powerupDiscountRate } = state.shop;
    if (powerup !== null) {
      if (this.itemIcon !== null) this.itemIcon.destroy();
      this.itemIcon = this.add
        .image(620, 1035, powerup.texture, powerup.frame)
        .setDepth(DEPTH.UIFRONT)
        .setScale(0.9);
    }

    let equipmentX = 98;
    equipment.forEach(({ texture, frame }) => {
      this.add
        .image(equipmentX, 1035, texture, frame)
        .setDepth(DEPTH.UIFRONT)
        .setScale(0.9);
      equipmentX += 160;
    });

    this.items.forEach((shopItem) => {
      if (powerup !== null && shopItem.item.type === "powerup") {
        shopItem.setDiscount(
          Math.floor((powerup.price * powerupDiscountRate) / 100) * 100
        );
      }
      if (shopItem.price > money) {
        shopItem.setCannotBuy();
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
        x: 73,
        y: 842,
        stepX: 31.5,
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
        x: 87,
        y: 869,
        stepX: 31.5,
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
      onComplete: () => this.bgm.stop(),
    });
  }

  playSoundEffect(key, adjustment = 1.0) {
    const volume = store.getState().settings.volumeSfx;
    this.sound.play(key, { volume: volume * adjustment });
  }

  doneShopping() {
    this.fadeBgm(1000);
    this.curtainsTo("Stage", Stage);
  }
}
