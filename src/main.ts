import k from "./kaplayCtx";
import { makeMotobug, makeRing, makeSonic } from "./entities";
import { GameObj } from "kaplay";

k.loadSprite("chemical-bg", "graphics/chemical-bg.png");
k.loadSprite("platforms", "graphics/platforms.png");
k.loadSprite("sonic", "graphics/sonic.png", {
  sliceX: 8,
  sliceY: 2,
  anims: {
    run: { from: 0, to: 7, loop: true, speed: 30 },
    jump: { from: 8, to: 15, loop: true, speed: 100 },
  },
});
k.loadSprite("ring", "graphics/ring.png", {
  sliceX: 16,
  sliceY: 1,
  anims: {
    spin: { from: 0, to: 15, loop: true, speed: 30 },
  },
});
k.loadSprite("motobug", "graphics/motobug.png", {
  sliceX: 5,
  sliceY: 1,
  anims: {
    run: { from: 0, to: 4, loop: true, speed: 8 },
  },
});
k.loadFont("mania", "fonts/mania.ttf");
k.loadSound("destroy", "sounds/Destroy.wav");
k.loadSound("hurt", "sounds/Hurt.wav");
k.loadSound("hyper-ring", "sounds/HyperRing.wav");
k.loadSound("jump", "sounds/Jump.wav");
k.loadSound("ring", "sounds/Ring.wav");

k.scene("game", () => {
  k.setGravity(3100);

  let gameSpeed = 100;
  k.loop(1, () => {
    gameSpeed += 50;
  });
  let score = 0;
  let scoreMultiplier = 0;
  const scoreText = k.add([
    k.text("SCORE : 0", { font: "mania", size: 48 }),
    k.pos(20, 20),
    k.z(2),
  ]);

  const gameControlsText = k.add([
    k.text("Press Space/Click/Touch to Jump!", {
      font: "mania",
      size: 32,
    }),
    k.anchor("center"),
    k.pos(k.center()),
    k.z(2),
  ]);

  gameControlsText.onButtonPress("jump", () => {
    k.destroy(gameControlsText);
  });

  const bgPieceWidth = 2880;
  const bgPieces = [
    k.add([k.sprite("chemical-bg"), k.pos(0, 0), k.opacity(0.8), k.scale(1.5)]),
    k.add([
      k.sprite("chemical-bg"),
      k.pos(bgPieceWidth, 0),
      k.opacity(0.8),
      k.scale(1.5),
    ]),
  ];

  const platformWidth = 2560;
  const platforms = [
    k.add([k.sprite("platforms"), k.pos(0, 450), k.scale(2)]),
    k.add([k.sprite("platforms"), k.pos(2560, 450), k.scale(2)]),
  ];

  const sonic = makeSonic(k.vec2(100, 100));
  sonic.setControls();
  sonic.setEvents();

  const ringCollectUI = sonic.add([
    k.text("", { font: "mania", size: 18 }),
    k.color(255, 255, 0),
    k.anchor("center"),
    k.pos(30, -10),
  ]);

  // static body for the platforms
  k.add([
    k.rect(1280, 200),
    k.opacity(0),
    k.pos(0, 641),
    k.area(),
    k.body({ isStatic: true }),
  ]);

  const spawnRing = () => {
    const ring = makeRing(k.vec2(1280, 610));
    ring.onUpdate(() => {
      ring.move(-gameSpeed, 0);
    });
    ring.onExitScreen(() => {
      if (ring.pos.x < 0) k.destroy(ring);
    });

    const waitTime = k.rand(0.5, 3);

    k.wait(waitTime, spawnRing);
  };

  spawnRing();

  sonic.onCollide("ring", (ring: GameObj) => {
    k.play("ring", { volume: 0.5 });
    k.destroy(ring);
    score++;
    scoreText.text = `SCORE : ${score}`;
    ringCollectUI.text = "+1";
    k.wait(1, () => {
      ringCollectUI.text = "";
    });
  });

  const spawnMotoBug = () => {
    const motobug = makeMotobug(k.vec2(1280, 595));
    motobug.onUpdate(() => {
      if (gameSpeed < 3000) {
        motobug.move(-(gameSpeed + 300), 0);
        return;
      }
      motobug.move(-gameSpeed, 0);
    });

    motobug.onExitScreen(() => {
      if (motobug.pos.x < 0) k.destroy(motobug);
    });

    const waitTime = k.rand(0.5, 2.5);

    k.wait(waitTime, spawnMotoBug);
  };

  spawnMotoBug();

  sonic.onCollide("enemy", (enemy) => {
    if (!sonic.isGrounded()) {
      k.play("destroy", { volume: 0.5 });
      k.play("hyper-ring", { volume: 0.5 });
      k.destroy(enemy);
      sonic.play("jump");
      sonic.jump();
      scoreMultiplier += 1;
      score += 10 * scoreMultiplier;
      scoreText.text = `SCORE : ${score}`;
      if (scoreMultiplier === 1)
        ringCollectUI.text = `+${10 * scoreMultiplier}`;
      if (scoreMultiplier > 1) ringCollectUI.text = `x${scoreMultiplier}`;
      k.wait(1, () => {
        ringCollectUI.text = "";
      });
      return;
    }

    k.play("hurt", { volume: 0.5 });
    k.setData("current-score", score);
    k.go("game-over");
  });

  sonic.onGround(() => {
    scoreMultiplier = 0;
  });

  k.onUpdate(() => {
    if (bgPieces[1].pos.x < 0) {
      bgPieces[0].moveTo(bgPieces[1].pos.x + bgPieceWidth, 0);
      const frontBgPiece = bgPieces.shift();
      // so typescript shuts up
      if (frontBgPiece) bgPieces.push(frontBgPiece);
    }

    bgPieces[0].move(-100, 0);
    bgPieces[1].moveTo(bgPieces[0].pos.x + bgPieceWidth, 0);

    if (platforms[1].pos.x < 0) {
      platforms[0].moveTo(
        platforms[1].pos.x + platformWidth,
        platforms[1].pos.y
      );
      const frontPlatform = platforms.shift();
      if (frontPlatform) platforms.push(frontPlatform);
    }

    platforms[0].move(-gameSpeed, 0);
    platforms[1].moveTo(platforms[0].pos.x + platformWidth, platforms[0].pos.y);
  });
});

k.scene("game-over", () => {
  let bestScore: number = k.getData("best-score") || 0;
  const currentScore: number | null = k.getData("current-score");

  if (currentScore && bestScore < currentScore) {
    k.setData("best-score", currentScore);
    bestScore = currentScore;
  }

  k.add([
    k.text("GAME OVER", { font: "mania", size: 64 }),
    k.anchor("center"),
    k.pos(k.center().x, k.center().y - 300),
  ]);
  k.add([
    k.text(`BEST SCORE : ${bestScore}`, {
      font: "mania",
      size: 32,
    }),
    k.anchor("center"),
    k.pos(k.center().x - 400, k.center().y - 200),
  ]);
  k.add([
    k.text(`CURRENT SCORE : ${currentScore}`, {
      font: "mania",
      size: 32,
    }),
    k.anchor("center"),
    k.pos(k.center().x + 400, k.center().y - 200),
  ]);

  k.wait(1, () => {
    k.add([
      k.text("Press Space/Click/Touch to Play Again SONIC RUNNWE BY TEAM F-SOCIETY", {
        font: "mania",
        size: 32,
      }),
      k.anchor("center"),
      k.pos(k.center().x, k.center().y + 200),
    ]);
    k.onButtonPress("jump", () => k.go("game"));
  });
});

k.go("game");
