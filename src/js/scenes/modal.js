import SoundSlider from "../components/soundslider";
import Toggle from "../components/toggle";
import ButtonFactory from "../components/uibutton";
import { DEPTH, HEIGHT, TEXT_STYLE, WIDTH } from "../globals";
import store from "../store";
import { getMessage } from "../utils";
import BaseScene from "./base";

const CloseButton = ButtonFactory("modal-close-buttons", true, {
  ...TEXT_STYLE,
  color: "#fff",
  fontSize: "50px",
});
const NavButton = ButtonFactory("modal-nav-buttons", true);

const BROWN_STYLE_SM = {
  ...TEXT_STYLE,
  fontSize: "24px",
  color: "#56301b",
};
const BROWN_STYLE_MD = {
  ...TEXT_STYLE,
  fontSize: "28px",
  color: "#56301b",
};
const BROWN_STYLE_LG = {
  ...TEXT_STYLE,
  fontSize: "32px",
  color: "#56301b",
};

export class BaseModal extends BaseScene {
  create({
    parentSceneKey,
    popup = true,
    closeButton = true,
    closeOnCover = true,
  }) {
    this.parentSceneKey = parentSceneKey;
    this.events.once("create", () => this.playSoundEffect("menu-open", 0.5));
    const cover = this.add
      .rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.5)
      .setDepth(DEPTH.BGBACK)
      .setInteractive();
    if (closeOnCover)
      cover.on("pointerdown", (pointer, x, y, event) => {
        event?.stopPropagation();
        this.returnToParent();
      });
    if (popup) {
      this.add
        .image(WIDTH / 2, HEIGHT / 2 - 100, "modal-blank")
        .setDepth(DEPTH.UIBACK)
        .setOrigin(0.5, 0.5)
        .setInteractive(this.input.makePixelPerfect());
    }
    if (closeButton) {
      this.buttonClose = new CloseButton(this, {
        x: WIDTH / 2,
        y: 930,
        text: getMessage("CLOSE"),
        base: 0,
        over: 1,
        overTextStyle: { color: "#7f7f7f" },
        upCallback: () => this.returnToParent(),
      });
    }
  }

  returnToParent(args) {
    this.events.once("pause", () => {
      this.scene.resume(this.parentSceneKey, args);
      this.scene.remove(this.scene.key);
    });
    this.scene.pause();
  }
}

const NAV_HORIZ_MARGIN = 220;
const NAV_HEIGHT = 760;
const PAGE_FOOTER_STYLE = {
  ...TEXT_STYLE,
  fontSize: "40px",
  color: "#56301b",
};

class PagedModal extends BaseModal {
  create(args) {
    super.create(args);
    this.pages = [[]];
    this.currentPage = 0;
    this.prevButton = new NavButton(this, {
      x: NAV_HORIZ_MARGIN,
      y: NAV_HEIGHT,
      base: 0,
      over: 1,
      downCallback: () => this.goToPrevious(),
    });
    this.nextButton = new NavButton(this, {
      x: WIDTH - NAV_HORIZ_MARGIN,
      y: NAV_HEIGHT,
      base: 2,
      over: 3,
      downCallback: () => this.goToNext(),
    });
    this.pageText = this.add
      .text(
        WIDTH / 2,
        NAV_HEIGHT,
        `${this.currentPage + 1} / ${this.pages.length}`,
        PAGE_FOOTER_STYLE
      )
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT);
  }

  renderPages() {
    this.pages.forEach((pageItems, index) => {
      const visible = index === this.currentPage;
      pageItems.forEach((item) => item.setVisible(visible));
    });
    this.pageText.setText(`${this.currentPage + 1} / ${this.pages.length}`);
    const isFirst = this.currentPage === 0;
    const isLast = this.currentPage === this.pages.length - 1;
    this.prevButton.show(!isFirst);
    this.nextButton.show(!isLast);
  }

  goToPrevious() {
    this.currentPage = Math.max(this.currentPage - 1, 0);
    this.renderPages();
  }

  goToNext() {
    this.currentPage = Math.min(this.currentPage + 1, this.pages.length - 1);
    this.renderPages();
  }
}

const SETTINGS_COL1 = 160;
const SETTINGS_COL2 = 430;
const SETTINGS_ROW1 = 420;
const SETTINGS_ROW2 = 500;
const SETTINGS_ROW3 = 580;
const SETTINGS_ROW4 = 660;
const SETTINGS_ROW5 = 750;

const ClearButton = ButtonFactory("modal-clear-buttons", false, BROWN_STYLE_LG);

export class SettingsModal extends BaseModal {
  create(args) {
    super.create(args);

    this.soundLabel = this.add
      .text(
        SETTINGS_COL1,
        SETTINGS_ROW1,
        getMessage("SETTINGS_SOUND"),
        BROWN_STYLE_LG
      )
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);
    this.soundToggle = new Toggle(this, {
      texture: "modal-toggle-buttons",
      x: SETTINGS_COL2,
      y: SETTINGS_ROW1,
      spacing: 190,
      target: "settings.mute",
      leftState: false,
      leftBase: 1,
      leftSelected: 0,
      rightBase: 3,
      rightSelected: 2,
      actionLeft: { type: "settings.toggleMute" },
      actionRight: { type: "settings.toggleMute" },
      toggleCallback: (value) => {
        this.musicSlider.setMute(value);
        this.sfxSlider.setMute(value);
      },
    });

    this.musicLabel = this.add
      .text(
        SETTINGS_COL1,
        SETTINGS_ROW2,
        getMessage("SETTINGS_MUSIC"),
        BROWN_STYLE_LG
      )
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);
    this.musicSlider = new SoundSlider(this, {
      x: SETTINGS_COL2,
      y: SETTINGS_ROW2,
      target: "settings.volumeMusic",
      changeAction: { type: "settings.setVolumeMusic" },
    }).setDepth(DEPTH.UIBACK);

    this.sfxLabel = this.add
      .text(
        SETTINGS_COL1,
        SETTINGS_ROW3,
        getMessage("SETTINGS_SFX"),
        BROWN_STYLE_LG
      )
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);
    this.sfxSlider = new SoundSlider(this, {
      x: SETTINGS_COL2,
      y: SETTINGS_ROW3,
      target: "settings.volumeSfx",
      changeAction: { type: "settings.setVolumeSfx" },
    }).setDepth(DEPTH.UIBACK);

    this.languageLabel = this.add
      .text(
        SETTINGS_COL1,
        SETTINGS_ROW4,
        getMessage("SETTINGS_LANG"),
        BROWN_STYLE_LG
      )
      .setDepth(DEPTH.UIFRONT)
      .setOrigin(0.5, 0.5);
    this.languageToggle = new Toggle(this, {
      texture: "tweet-language-buttons",
      x: SETTINGS_COL2,
      y: SETTINGS_ROW4,
      spacing: 190,
      target: "settings.language",
      leftState: "ja",
      leftBase: 3,
      leftSelected: 2,
      rightBase: 1,
      rightSelected: 0,
      actionLeft: { type: "settings.setJapanese" },
      actionRight: { type: "settings.setEnglish" },
      toggleCallback: () => this.refreshDisplay(),
    });

    this.clearButton = new ClearButton(this, {
      x: WIDTH / 2,
      y: SETTINGS_ROW5,
      text: getMessage("SETTINGS_CLEAR"),
      base: 1,
      over: 0,
      overTextStyle: { color: "#fff2de" },
      upCallback: () => {
        if (confirm(getMessage("SETTINGS_CONFIRM_CLEAR"))) {
          store.dispatch({ type: "global.clearData" });
          this.refreshDisplay();
        }
      },
    });

    this.refreshDisplay();

    if (this.soundToggle.state === true) {
      this.musicSlider.setMute();
      this.sfxSlider.setMute();
    }
  }

  refreshDisplay() {
    this.soundLabel.setText(getMessage("SETTINGS_SOUND"));
    this.musicLabel.setText(getMessage("SETTINGS_MUSIC"));
    this.sfxLabel.setText(getMessage("SETTINGS_SFX"));
    this.languageLabel.setText(getMessage("SETTINGS_LANG"));
    this.clearButton.setText(getMessage("SETTINGS_CLEAR"));
    this.buttonClose.setText(getMessage("CLOSE"));
    this.soundToggle.rerender();
    this.musicSlider.refreshState();
    this.sfxSlider.refreshState();
    this.languageToggle.rerender();
    this.scene.get(this.parentSceneKey).events.emit("rerender");
  }
}

const CREDITS_TOP = 380;
const CREDITS_SPACING = 35;
const CREDITS_INTERVAL = 90;
const CREDITS_MARGIN = 230;

export class CreditsModal extends PagedModal {
  create(args) {
    super.create(args);

    const playtesters = [
      "Blaze",
      "bobland",
      "Cody Connekt",
      "gottagoms123",
      "Konbo",
      "natsuki",
      "PingTKP",
      "RAIA!?",
      "riluu",
      "Stryv",
      "Xrave",
      "ここあ",
      "バリカツオ",
      "小倉もみじ",
    ];

    this.pages = [
      [
        this.add
          .text(
            WIDTH / 2,
            CREDITS_TOP,
            getMessage("CREDITS_PROGRAMMER"),
            BROWN_STYLE_SM
          )
          .setDepth(DEPTH.UIFRONT)
          .setOrigin(0.5, 0.5),
        this.add
          .text(
            WIDTH / 2,
            CREDITS_TOP + CREDITS_SPACING,
            "lyger (@lyger_0)",
            BROWN_STYLE_LG
          )
          .setDepth(DEPTH.UIFRONT)
          .setOrigin(0.5, 0.5),
        this.add
          .text(
            WIDTH / 2,
            CREDITS_TOP + CREDITS_INTERVAL,
            getMessage("CREDITS_ART"),
            BROWN_STYLE_SM
          )
          .setDepth(DEPTH.UIFRONT)
          .setOrigin(0.5, 0.5),
        this.add
          .text(
            WIDTH / 2,
            CREDITS_TOP + CREDITS_INTERVAL + CREDITS_SPACING,
            "もちょみ (@motityomi)",
            BROWN_STYLE_LG
          )
          .setDepth(DEPTH.UIFRONT)
          .setOrigin(0.5, 0.5),
        this.add
          .text(
            WIDTH / 2,
            CREDITS_TOP + 2 * CREDITS_INTERVAL,
            getMessage("CREDITS_SOUND"),
            BROWN_STYLE_SM
          )
          .setDepth(DEPTH.UIFRONT)
          .setOrigin(0.5, 0.5),
        this.add
          .text(
            WIDTH / 2,
            CREDITS_TOP + 2 * CREDITS_INTERVAL + CREDITS_SPACING,
            "Sayuu (@sayuusic)",
            BROWN_STYLE_LG
          )
          .setDepth(DEPTH.UIFRONT)
          .setOrigin(0.5, 0.5),
        this.add
          .text(
            WIDTH / 2,
            CREDITS_TOP + 3 * CREDITS_INTERVAL,
            getMessage("CREDITS_MUSIC"),
            BROWN_STYLE_SM
          )
          .setDepth(DEPTH.UIFRONT)
          .setOrigin(0.5, 0.5),
        this.add
          .text(
            WIDTH / 2,
            CREDITS_TOP + 3 * CREDITS_INTERVAL + CREDITS_SPACING,
            "メリッサ (@LockP_melissa)",
            BROWN_STYLE_LG
          )
          .setDepth(DEPTH.UIFRONT)
          .setOrigin(0.5, 0.5),
      ],

      [
        this.add
          .text(
            WIDTH / 2,
            CREDITS_TOP,
            getMessage("CREDITS_PLAYTESTER"),
            BROWN_STYLE_SM
          )
          .setDepth(DEPTH.UIFRONT)
          .setOrigin(0.5, 0.5),
        this.add
          .text(
            CREDITS_MARGIN,
            CREDITS_TOP + CREDITS_SPACING - 16,
            playtesters.slice(0, Math.ceil(playtesters.length / 2)).join("\n"),
            {
              ...BROWN_STYLE_LG,
            }
          )
          .setDepth(DEPTH.UIFRONT)
          .setOrigin(0.5, 0),
        this.add
          .text(
            WIDTH - CREDITS_MARGIN,
            CREDITS_TOP + CREDITS_SPACING - 16,
            playtesters.slice(Math.ceil(playtesters.length / 2)).join("\n"),
            {
              ...BROWN_STYLE_LG,
            }
          )
          .setDepth(DEPTH.UIFRONT)
          .setOrigin(0.5, 0),
      ],
    ];

    this.renderPages();
  }
}

export class InstructionsModal extends PagedModal {
  create(args) {
    super.create(args);
    this.pages = [this.createPage1(), this.createPage2()];

    this.renderPages();

    store.dispatch({ type: "settings.viewInstructions" });
  }

  createPage1() {
    const CONTROLS_TOP = 380;
    const CONTROLS_INTERVAL = 75;

    return [
      this.add
        .text(240, CONTROLS_TOP, getMessage("CONTROLS_W"), BROWN_STYLE_LG)
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(0.5, 0.5),
      this.add
        .text(
          240,
          CONTROLS_TOP + CONTROLS_INTERVAL,
          getMessage("CONTROLS_S"),
          BROWN_STYLE_LG
        )
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(0.5, 0.5),
      this.add
        .text(
          240,
          CONTROLS_TOP + 2 * CONTROLS_INTERVAL,
          getMessage("CONTROLS_A"),
          BROWN_STYLE_LG
        )
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(0.5, 0.5),
      this.add
        .text(
          240,
          CONTROLS_TOP + 3 * CONTROLS_INTERVAL,
          getMessage("CONTROLS_D"),
          BROWN_STYLE_LG
        )
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(0.5, 0.5),
      this.add
        .text(
          240,
          CONTROLS_TOP + 4 * CONTROLS_INTERVAL,
          getMessage("CONTROLS_SPACE"),
          BROWN_STYLE_LG
        )
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(0.5, 0.5),
      this.add.image(480, 530, "controls-info").setDepth(DEPTH.UIFRONT),
    ];
  }

  createPage2() {
    const COL1 = 270;
    const COL2 = 500;
    const ROW1_HEIGHT = 400;
    const ROW2_HEIGHT = 520;
    const ROW3_HEIGHT = 640;
    return [
      this.add
        .text(
          COL1,
          ROW1_HEIGHT,
          getMessage("INSTRUCTIONS_MATSURISU"),
          BROWN_STYLE_MD
        )
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(0.5, 0.5),
      this.add
        .image(COL2, ROW1_HEIGHT, "matsurisu-normal")
        .setDepth(DEPTH.UIFRONT),
      this.add
        .text(
          COL1,
          ROW2_HEIGHT,
          getMessage("INSTRUCTIONS_COIN"),
          BROWN_STYLE_MD
        )
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(0.5, 0.5),
      this.add.image(COL2, ROW2_HEIGHT, "items", 2).setDepth(DEPTH.UIFRONT),
      this.add
        .text(
          COL1,
          ROW3_HEIGHT,
          getMessage("INSTRUCTIONS_POWERUP"),
          BROWN_STYLE_MD
        )
        .setDepth(DEPTH.UIFRONT)
        .setOrigin(0.5, 0.5),
      this.add
        .image(COL2 - 20, ROW3_HEIGHT - 20, "items", 3)
        .setDepth(DEPTH.UIFRONT)
        .setScale(0.75),
      this.add
        .image(COL2 + 30, ROW3_HEIGHT - 10, "items", 5)
        .setDepth(DEPTH.UIFRONT)
        .setScale(0.75),
      this.add
        .image(COL2, ROW3_HEIGHT + 20, "items", 7)
        .setDepth(DEPTH.UIFRONT)
        .setScale(0.75),
    ];
  }
}
