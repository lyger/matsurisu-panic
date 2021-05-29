import Phaser from "phaser";
import { DEPTH, TEXT_STYLE } from "../../globals";
import store from "../../store";
import { descendingSortedIndex } from "../../utils";

const WHITE_STYLE = { ...TEXT_STYLE, color: "#fff" };

class ShopItem extends Phaser.GameObjects.Container {
  constructor(scene, item) {
    super(scene);

    this.item = item;
    this.discountAmount = 0;

    const lang = store.getState().settings.language;

    this.frame = new Phaser.GameObjects.Sprite(
      this.scene,
      0,
      0,
      "shop-frame",
      0
    )
      .setOrigin(0.5, 0.5)
      .setInteractive(scene.input.makePixelPerfect());
    this.descriptionText = new Phaser.GameObjects.Text(
      this.scene,
      0,
      -110,
      item.description[lang],
      { ...WHITE_STYLE, fontSize: "24px" }
    ).setOrigin(0.5, 0.5);
    this.itemIcon = new Phaser.GameObjects.Sprite(
      this.scene,
      0,
      -22,
      this.item.texture,
      this.item.frame
    ).setOrigin(0.5, 0.5);
    this.priceText = new Phaser.GameObjects.Text(
      this.scene,
      0,
      80,
      `¥${this.item.price.toLocaleString("en-US")}`,
      WHITE_STYLE
    )
      .setOrigin(0.5, 0.5)
      .setDepth(1);
    this.discountSlash = new Phaser.GameObjects.Line(
      this.scene,
      0,
      0,
      0,
      80,
      110,
      80,
      0xffffff
    )
      .setLineWidth(3)
      .setVisible(false);
    this.discountText = new Phaser.GameObjects.Text(this.scene, 0, 95, "", {
      ...TEXT_STYLE,
      color: "#fc5854",
    })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.frame.on("pointerdown", this.handlePurchase, this);
    this.add([
      this.frame,
      this.descriptionText,
      this.itemIcon,
      this.priceText,
      this.discountSlash,
      this.discountText,
    ]);
  }

  get price() {
    // Special case for the one item that actually costs zero
    if (this.item.price === 0) return 0;
    // Discounted items will always cost at least one coin
    return Math.max(
      this.item.price - this.discountAmount,
      store.getState().score.moneyPerCoin
    );
  }

  setDiscount(amount) {
    this.discountAmount = amount;
    this.discountSlash.setVisible(true);
    this.discountText
      .setText(`¥${this.price.toLocaleString("en-US")}`)
      .setVisible(true);
  }

  buy(scene) {
    store.dispatch({ type: "score.loseMoney", payload: this.price });
    this.item.buy(scene);
  }

  handlePurchase() {
    this.scene.events.emit("shop.confirmPurchase", this);
  }

  setCannotBuy() {
    this.descriptionText.setColor("#7f7f7f");
    this.frame.removeInteractive().setFrame(1);
    this.itemIcon.setTint(0x7f7f7f);
    this.priceText.setColor("#7f7f7f");
    this.discountSlash.setStrokeStyle(3, 0x7f7f7f);
    this.discountText.setColor("#7e2c2a");
  }
}

export default class Item {
  constructor(
    type,
    {
      name,
      description = { en: "", ja: "" },
      tier = 0,
      texture = "items",
      frame,
      price,
      purchaseLimit = -1,
      purchaseSound = "shop-buy",
      purchaseConditions,
      buySideEffect = null,
    }
  ) {
    this.type = type;
    this.name = name;
    this.description = description;
    this.tier = tier;
    this.texture = texture;
    this.frame = frame;
    this.price = price;
    this.purchaseLimit = purchaseLimit;
    this.buySideEffect = buySideEffect;
    this.purchaseSound = purchaseSound;
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
      state.stage.level >= this.tier &&
      this.purchaseConditions.every((cond) => cond(state))
    );
  }

  buy(scene) {
    this.numPurchased++;
    if (this.buySideEffect !== null) this.buySideEffect(scene);
    scene.playSoundEffect?.(this.purchaseSound);
    this.handleBuy(scene);
  }

  handleBuy(scene) {
    throw new Error("Please inherit Item and implement the handleBuy method");
  }

  addToShop(scene) {
    const shopItem = new ShopItem(scene, this).setDepth(DEPTH.UIBACK);
    scene.add.existing(shopItem);
    return shopItem;
  }
}
