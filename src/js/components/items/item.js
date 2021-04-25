import Phaser from "phaser";
import { DEPTH, TEXT_STYLE } from "../../globals";
import store from "../../store";

class ShopItem extends Phaser.GameObjects.Container {
  constructor(scene, item) {
    super(scene);
    this.item = item;
    this.frame = new Phaser.GameObjects.Sprite(
      this.scene,
      0,
      0,
      "shop-frame",
      0
    )
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIBACK)
      .setInteractive(scene.input.makePixelPerfect());
    this.itemIcon = new Phaser.GameObjects.Sprite(
      this.scene,
      0,
      -22,
      this.item.texture,
      this.item.frame
    )
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);
    this.itemText = new Phaser.GameObjects.Text(
      this.scene,
      0,
      80,
      `¥${this.item.price}`,
      { ...TEXT_STYLE, color: "#fff" }
    )
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);
    this.frame.on("pointerdown", this.handlePurchase, this);
    this.add([this.frame, this.itemIcon, this.itemText]);
  }

  handlePurchase() {
    this.scene.events.emit("shop.confirmPurchase", this);
  }

  setCannotBuy() {
    this.frame.removeInteractive().setFrame(1);
    this.itemIcon.setTint(0x7f7f7f);
    this.itemText.setColor("#7f7f7f");
  }
}

export default class Item {
  constructor(
    type,
    {
      name,
      tier = 0,
      texture = "items",
      frame,
      price,
      purchaseLimit = -1,
      purchaseConditions,
      buySideEffect = null,
    }
  ) {
    this.type = type;
    this.name = name;
    this.tier = tier;
    this.texture = texture;
    this.frame = frame;
    this.price = price;
    this.purchaseLimit = purchaseLimit;
    this.buySideEffect = buySideEffect;
    this.numPurchased = 0;
    this.purchaseConditions =
      purchaseConditions === undefined || purchaseConditions === null
        ? []
        : purchaseConditions;
  }

  get canBuy() {
    const state = store.getState();
    return (
      (this.purchaseLimit < 0 || this.numPurchased < this.purchaseLimit) &&
      this.purchaseConditions.reduce((prev, cond) => prev && cond(state), true)
    );
  }

  buy(scene) {
    this.numPurchased++;
    store.dispatch({ type: "score.loseMoney", payload: this.price });
    if (this.buySideEffect !== null) this.buySideEffect(scene);
    this.handleBuy(scene);
  }

  handleBuy(scene) {
    throw new Error("Please inherit Item and implement the handleBuy method");
  }

  addToShop(scene) {
    const shopItem = new ShopItem(scene, this);
    scene.add.existing(shopItem);
    return shopItem;
  }
}
