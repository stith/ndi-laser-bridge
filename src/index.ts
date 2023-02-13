import { DAC } from '@laser-dac/core';
import { Scene } from '@laser-dac/draw';
import { Color } from '@laser-dac/draw/dist/Point';
import { Simulator } from '@laser-dac/simulator';
import grandiose from 'grandiose';

import { Wave } from './scenes/wave';

// How many attempts to find the NDI stream?
const NDI_ATTEMPTS = 3;

// How many vertical slices to cut the screen into, both for laser drawing and color averaging
const RESOLUTION = 500;

(async () => {
  const dac = new DAC();
  dac.use(new Simulator());
  await dac.start();

  console.log('Starting...')



  let source: grandiose.Source | undefined;
  console.info('Looking for NDI source...');
  for (let i = 0; i < NDI_ATTEMPTS; i++) {
    const sources = await grandiose.find({ showLocalSources: true })
      .catch(e => {
        console.log('Error while finding NDI sources', e);
      });
    source = sources?.find(s => s.name.includes('Arena'));

    if (source) {
      break;
    } else {
      console.info(`No NDI sources found, attempt ${i}/${NDI_ATTEMPTS}.`)
    }
  }

  if (!source) {
    console.error('No NDI source found, bailing.')
    process.exit(1);
    return;
  }
  const receiver = await grandiose.receive({
    source: source,
    colorFormat: grandiose.COLOR_FORMAT_RGBX_RGBA,
  });
  const dataFrame = await receiver.data();
  console.log({dataFrame})


  const waves: Wave[] = [
    new Wave({
      x: 0,
      y: 0.5,
      frequency: 20,
      amplitude: 0.5,
      speed: 1,
      steps: RESOLUTION,
    })
  ];

  const scene = new Scene();

  let lastTime = Date.now();
  async function renderFrame() {
    const sampleLine: Color[] = [];
    try {
      const aFrame = await receiver.video();
      for (let i = 0; i < aFrame.xres; i++) {
        const base = i * 4;
        sampleLine.push([
          aFrame.data[base],
          aFrame.data[base+1],
          aFrame.data[base+2],
        ]);
      }
    } catch(e) {
      console.error('Error getting video frame:', e);
    }

    const colorSamples = sampleLine.reduce((sample, pixel, i) => {
      // First, group pixels by screen slice
      const perChunk = Math.ceil(sampleLine.length / RESOLUTION);
      const chunk = Math.floor(i / perChunk)
      if (!sample[chunk]) {
        sample[chunk] = [];
      }
      sample[chunk].push(pixel);

      return sample;
    }, [] as Color[][]).reduce((pixelGroup, item) => {
      // Then, average the groups
      const summed = item.reduce((prev, next) =>
        [prev[0] + next[0], prev[1] + next[1], prev[2] + next[2]]
      , [0, 0, 0])
      pixelGroup.push([
        (summed[0] / item.length) / 256,
        (summed[1] / item.length) / 256,
        (summed[2] / item.length) / 256,
      ]);
      return pixelGroup;
    }, [] as Color[]);

    scene.reset();
    const curTime = Date.now();
    const timeStep = (curTime - lastTime) / 1000;

    waves.forEach((wave) => {
      wave.update(timeStep);
      const paths = wave.draw();
      let lastSample: Color | undefined;
      paths.forEach((p, i) => {
        lastSample = colorSamples[i] ?? lastSample;
        p.color = lastSample;
      })
      paths.forEach(p => scene.add(p));
    });

    lastTime = curTime;
  }

  scene.start(renderFrame);
  dac.stream(scene);
})();
