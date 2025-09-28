import k from "./kaplayCtx";
import { Vec2, GameObj } from "kaplay";

export function makeSonic(position: Vec2) {
  return k.add([
    k.sprite("sonic", { anim: "run" }),
    k.scale(3),
    k.area(),
    k.anchor("center"),
    k.pos(position),
    k.body({ jumpForce: 1700 }),
    {
      setControls(this: GameObj) {
        k.onButtonPress("jump", () => {
          if (this.isGrounded()) {
            this.play("jump");
            this.jump();
            k.play("jump", { volume: 0.5 });
          }
        });
      },
      setEvents(this: GameObj) {
        this.onGround(() => {
          this.play("run");
        });
      },
    },
  ]);
}

export function makeRing(position: Vec2) {
  return k.add([
    k.sprite("ring", { anim: "spin" }),
    k.area(),
    k.scale(3),
    k.anchor("center"),
    k.pos(position),
    k.offscreen(),
    "ring",
  ]);
}

export function makeMotobug(position: Vec2) {
  return k.add([
    k.sprite("motobug", { anim: "run" }),
    k.area({ shape: new k.Rect(k.vec2(-5, 0), 32, 32) }),
    k.scale(3),
    k.anchor("center"),
    k.pos(position),
    k.offscreen(),
    "enemy",
  ]);
}
