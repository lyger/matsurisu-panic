/*
 * itemConfig is of the format
 * {
 *   name: string,
 *   type: enum [powerup, outfit, accessory],
 *   cls: class,
 * }
 */

export default class ShopItem {
  constructor(itemConfig, price, purchaseLimit = -1) {
    this.item = itemConfig;
    this.price = price;
    this.purchaseLimit = purchaseLimit;
    this.numPurchased = 0;
  }
}
