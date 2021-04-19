import { DEPTH, TEXT_STYLE } from "../../globals";
import store from "../../store";

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
    }
  ) {
    this.type = type;
    this.name = name;
    this.tier = tier;
    this.texture = texture;
    this.frame = frame;
    this.price = price;
    this.purchaseLimit = purchaseLimit;
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

  buy() {
    this.numPurchased++;
    store.dispatch({ type: "score.loseMoney", payload: this.price });
    this.handleBuy();
  }

  handleBuy() {
    throw new Error("Please inherit Item and implement the handleBuy method");
  }

  addToShop(scene) {
    const itemIcon = new Phaser.GameObjects.Image(
      scene,
      0,
      0,
      this.texture,
      this.frame
    )
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.OBJECTDEPTH)
      .setInteractive(scene.input.makePixelPerfect());

    const itemPrice = new Phaser.GameObjects.Text(
      scene,
      0,
      80,
      `¥${this.price}`,
      TEXT_STYLE
    )
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.OBJECTDEPTH)
      .setInteractive();

    const shopItem = scene.add
      .container(0, 0, [itemIcon, itemPrice])
      .setData("target", this);

    const handleClick = () => {
      scene.events.emit("shop.confirmPurchase", shopItem);
    };

    itemIcon.on("pointerdown", handleClick);
    itemPrice.on("pointerdown", handleClick);

    return shopItem;
  }
}
