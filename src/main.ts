import k from "./kaplayCtx";
import { makeMotobug, makeRing, makeSonic } from "./entities";
import { GameObj } from "kaplay";

// --- Load assets ---
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
  anims: { spin: { from: 0, to: 15, loop: true, speed: 30 } },
});
k.loadSprite("motobug", "graphics/motobug.png", {
  sliceX: 5,
  sliceY: 1,
  anims: { run: { from: 0, to: 4, loop: true, speed: 8 } },
});
k.loadFont("mania", "fonts/mania.ttf");
k.loadSound("destroy", "sounds/Destroy.wav");
k.loadSound("hurt", "sounds/Hurt.wav");
k.loadSound("hyper-ring", "sounds/HyperRing.wav");
k.loadSound("jump", "sounds/Jump.wav");
k.loadSound("ring", "sounds/Ring.wav");

// --- Game variables ---
let health = 100;
let healthBar: GameObj;
let healthBarBG: GameObj;
let gameSpeed = 200; // 🔥 faster initial speed

// --- Function to start/reset game ---
function startGame() {
  k.scene("game", () => {
    k.setGravity(3100);

    // --- Reset variables ---
    health = 100;
    gameSpeed = 200; // 🔥 reset fast speed
    let score = 0;
    let scoreMultiplier = 0;

    // --- Background ---
    const bgPieceWidth = 2880;
    const bgPieces = [
      k.add([k.sprite("chemical-bg"), k.pos(0, 0), k.opacity(0.8), k.scale(1.5)]),
      k.add([k.sprite("chemical-bg"), k.pos(bgPieceWidth, 0), k.opacity(0.8), k.scale(1.5)]),
    ];

    // --- Platforms ---
    const platformWidth = 2560;
    const platforms = [
      k.add([k.sprite("platforms"), k.pos(0, 450), k.scale(2)]),
      k.add([k.sprite("platforms"), k.pos(2560, 450), k.scale(2)]),
    ]; 

    // --- Sonic player ---
    const sonic = makeSonic(k.vec2(100, 100));
    sonic.setControls();
    sonic.setEvents();

    // --- Score UI ---
    const scoreText = k.add([k.text("SCORE : 0", { font: "mania", size: 48 }), k.pos(20, 20), k.z(2)]);
    const ringCollectUI = sonic.add([k.text("", { font: "mania", size: 18 }), k.color(255, 255, 0), k.anchor("center"), k.pos(30, -10)]);

    // --- Health bar ---
    healthBarBG = k.add([k.rect(200, 20), k.pos(20, 80), k.color(0, 0, 255)]);
    healthBar   = k.add([k.rect(200, 20), k.pos(20, 80), k.color(255, 0, 0)]); 

    function updateHealthUI() {
      healthBar.width = health * 2; // ONLY width changes
    }

    // --- Static body for platforms ---
    k.add([k.rect(1280, 200), k.opacity(0), k.pos(0, 641), k.area(), k.body({ isStatic: true })]);

    // --- Spawn rings ---
    const spawnRing = () => {
      const ring = makeRing(k.vec2(1280, 610));
      ring.onUpdate(() => ring.move(-gameSpeed, 0));
      ring.onExitScreen(() => ring.pos.x < 0 && k.destroy(ring));
      k.wait(k.rand(0.5, 3), spawnRing);
    };
    spawnRing();

    // --- Ring collision ---
    sonic.onCollide("ring", (ring: GameObj) => {
      k.play("ring", { volume: 0.5 });
      k.destroy(ring);
      score++;
      scoreText.text = `SCORE : ${score}`;
      ringCollectUI.text = "+1";
      k.wait(1, () => (ringCollectUI.text = ""));
    });

    // --- Spawn motobugs ---
    const spawnMotoBug = () => {
      const motobug = makeMotobug(k.vec2(1280, 595));
      motobug.onUpdate(() => motobug.move(-(gameSpeed + 400), 0)); // 🔥 faster enemy
      motobug.onExitScreen(() => motobug.pos.x < 0 && k.destroy(motobug));
      k.wait(k.rand(0.5, 2.5), spawnMotoBug);
    };
    spawnMotoBug();

    // --- Sonic collision with enemies ---
    sonic.onCollide("enemy", (enemy: GameObj) => {
      if (!sonic.isGrounded()) {
        k.play("destroy", { volume: 0.5 });
        k.play("hyper-ring", { volume: 0.5 });
        k.destroy(enemy);
        sonic.play("jump");
        sonic.jump();
        scoreMultiplier += 1;
        score += 10 * scoreMultiplier;
        scoreText.text = `SCORE : ${score}`;
        if (scoreMultiplier === 1) ringCollectUI.text = `+${10 * scoreMultiplier}`;
        if (scoreMultiplier > 1) ringCollectUI.text = `x${scoreMultiplier}`;
        k.wait(1, () => (ringCollectUI.text = ""));
        return;
      }
      health -= 20;
      if (health < 0) health = 0;
      updateHealthUI();

      if (health <= 0) {
        k.setData("current-score", score);
        k.go("game-over");
      }
    });

    sonic.onGround(() => (scoreMultiplier = 0));

    // --- Health regeneration sequence ---
    const regenTimes = [6, 8, 10];
    let regenIndex = 0;
    function regenHealth() {
      if (regenIndex >= regenTimes.length) return;
      k.wait(regenTimes[regenIndex], () => {
        health += 5;
        if (health > 100) health = 100;
        updateHealthUI();
        regenIndex++;
        regenHealth();
      });
    }
    regenHealth();

    // --- Game speed increases automatically over time ---
    function increaseSpeed() {
      k.wait(5, () => {
        gameSpeed += 50; // 🔥 faster speed increment
        increaseSpeed();
      });
    }
    increaseSpeed();

    // --- Background & platform movement ---
    k.onUpdate(() => {
      if (bgPieces[1].pos.x < 0) {
        bgPieces[0].moveTo(bgPieces[1].pos.x + 2880, 0);
        bgPieces.push(bgPieces.shift()!);
      }
      bgPieces[0].move(-150, 0); // 🔥 faster background
      bgPieces[1].moveTo(bgPieces[0].pos.x + 2880, 0);

      if (platforms[1].pos.x < 0) {
        platforms[0].moveTo(platforms[1].pos.x + 2560, platforms[1].pos.y);
        platforms.push(platforms.shift()!);
      }
      platforms[0].move(-gameSpeed, 0); // 🔥 faster platforms
      platforms[1].moveTo(platforms[0].pos.x + 2560, platforms[0].pos.y);
    });
  });

  // --- Game over scene ---
  k.scene("game-over", () => {
    let bestScore: number = k.getData("best-score") || 0;
    const currentScore: number | null = k.getData("current-score");

    if (currentScore && bestScore < currentScore) {
      k.setData("best-score", currentScore);
      bestScore = currentScore;
    }

    k.add([k.text("GAME OVER", { font: "mania", size: 64 }), k.anchor("center"), k.pos(k.center().x, k.center().y - 300)]);
    k.add([k.text(`BEST SCORE : ${bestScore}`, { font: "mania", size: 32 }), k.anchor("center"), k.pos(k.center().x - 400, k.center().y - 200)]);
    k.add([k.text(`CURRENT SCORE : ${currentScore}`, { font: "mania", size: 32 }), k.anchor("center"), k.pos(k.center().x + 400, k.center().y - 200)]);
    k.add([k.text(`"EVERYYHING NEEEDS SACRIFICE, EVEN HEAVEN DEMANDS DEATH"`, { font: "mania", size: 28 }), k.anchor("center"), k.pos(k.center().x, k.center().y - 100)]);

    k.wait(1, () => {
      k.add([
        k.text("Press Space/Click/Touch to Play Again SONIC RUNNER BY TEAM F-SOCIETY", { font: "mania", size: 32 }),
        k.anchor("center"),
        k.pos(k.center().x, k.center().y + 200)
      ]);
      k.onButtonPress("jump", () => startGame());
    });
  });

  k.go("game");
}

// --- Start game initially ---
startGame();