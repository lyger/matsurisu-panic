import Phaser from "phaser";
import { getShopItems } from "../components/items/catalog";
import ButtonFactory from "../components/uibutton";
import { DEPTH, HEIGHT, TEXT_STYLE, WIDTH } from "../globals";
import store from "../store";
import Stage from "./stage";

const ShopConfirmButton = ButtonFactory("shop-confirm-buttons", true);

class ShopConfirmModal extends Phaser.Scene {
  create({ item, buyCallback }) {
    this.add
      .image(WIDTH / 2, HEIGHT / 2, "shop-confirm-modal")
      .setDepth(DEPTH.UIBACK)
      .setOrigin(0.5, 0.5);

    const state = store.getState();
    const currentPowerup = state.player.powerup;

    if (item.type === "powerup" && currentPowerup !== null) {
      this.add
        .image(
          WIDTH / 2 - 100,
          HEIGHT / 2,
          currentPowerup.texture,
          currentPowerup.frame
        )
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(0.5, 0.5);
      this.add
        .image(WIDTH / 2, HEIGHT / 2, "shop-confirm-arrow")
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(0.5, 0.5);
      this.add
        .image(WIDTH / 2 + 100, HEIGHT / 2, item.texture, item.frame)
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(0.5, 0.5);
    } else {
      this.add
        .image(WIDTH / 2, HEIGHT / 2, item.texture, item.frame)
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(0.5, 0.5);
    }

    this.buttonNo = new ShopConfirmButton(this, {
      x: WIDTH / 2 - 100,
      y: HEIGHT / 2 + 120,
      default: 0,
      over: 1,
      down: 1,
      downCallback: () => this.returnToShop(),
    });

    this.buttonYes = new ShopConfirmButton(this, {
      x: WIDTH / 2 + 100,
      y: HEIGHT / 2 + 120,
      default: 2,
      over: 3,
      down: 3,
      downCallback: () => {
        item.buy();
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
    this.background = this.add.rectangle(
      WIDTH / 2,
      HEIGHT / 2,
      720,
      1280,
      0x555555
    );
    const shopItems = getShopItems();
    this.items = shopItems.map((item) => item.addToShop(this));
    Phaser.Actions.GridAlign(this.items, {
      x: 210,
      y: 300,
      width: 2,
      height: 3,
      cellWidth: 300,
      cellHeight: 300,
      position: Phaser.Display.Align.CENTER,
    });

    this.events.on("shop.confirmPurchase", (itemIcon) => {
      const item = itemIcon.getData("target");
      const buyCallback = () => {
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

    this.livesText = this.add
      .text(250, 800, "LIVES: 3", TEXT_STYLE)
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);
    this.moneyText = this.add
      .text(470, 800, "MONEY: 0", TEXT_STYLE)
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);
    this.itemLabel = this.add
      .text(WIDTH / 2, 875, "ITEM", TEXT_STYLE)
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);
    this.itemIcon = null;

    this.doneButton = new ShopButton(this, {
      x: WIDTH / 2,
      y: 1100,
      default: 0,
      over: 1,
      downCallback: () => this.doneShopping(),
    });

    this.add.existing(this.doneButton);

    this.refreshState();
  }

  refreshState() {
    const state = store.getState();
    const { money, lives } = state.score;
    const { powerup } = state.player;
    this.livesText.setText(`LIVES: ${lives}`);
    this.moneyText.setText(`MONEY: ${money}`);
    if (powerup !== null) {
      if (this.itemIcon !== null) this.itemIcon.destroy();
      this.itemIcon = this.add
        .image(WIDTH / 2, 950, powerup.texture, powerup.frame)
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(0.5, 0.5);
    }

    this.items.forEach((itemIcon) => {
      const item = itemIcon.getData("target");
      if (item.price > money) {
        itemIcon.getAll("input").forEach((part) => this.input.disable(part));
        itemIcon.setAlpha(0.5);
      }
    });
  }

  doneShopping() {
    this.scene.add("Stage", Stage, true);
    this.scene.remove(this.scene.key);
  }
}
