import kaplay from "kaplay";

const k = kaplay({
  width: 1280,
  height: 720,
  background: [0, 0, 0],
  letterbox: true,
  global: false,
  buttons: {
    jump: {
      keyboard: ["space"],
      mouse: "left",
    },
  },
  touchToMouse: true,
  debug: false, // set it to true initially
  pixelDensity: window.devicePixelRatio,
});

export default k;
