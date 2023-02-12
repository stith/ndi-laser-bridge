import { DAC } from '@laser-dac/core';
import { Scene } from '@laser-dac/draw';
import { Simulator } from '@laser-dac/simulator';

import { Wave } from './scenes/wave';


(async () => {
  const dac = new DAC();
  dac.use(new Simulator());
  await dac.start();
  console.log('Starting...')

  const waves: Wave[] = [
    new Wave({
      x: 0,
      y: 0.5,
      frequency: 20,
      amplitude: 0.5,
      speed: 1,
      steps: 100,
    })
  ];

  const scene = new Scene();

  let lastTime = Date.now();
  function renderFrame() {
    scene.reset();
    const curTime = Date.now();
    const timeStep = (curTime - lastTime) / 1000;
    waves.forEach((wave) => {
      wave.update(timeStep);
      const paths = wave.draw();
      paths.forEach(p => scene.add(p));
    });
    lastTime = curTime;
  }

  scene.start(renderFrame);
  dac.stream(scene);
})();
