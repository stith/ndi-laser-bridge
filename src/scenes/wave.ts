import { Line } from '@laser-dac/draw';
import { hsv } from 'color-convert';

interface WaveOptions {
  x: number;
  y: number;
  frequency: number;
  amplitude: number;
  steps: number;
  speed?: number;
}

interface PathComponent {
  x: number;
  y: number;
}

export class Wave {
  x: number;
  y: number;
  frequency: number;
  amplitude: number;
  offset: number;
  steps: number;
  speed: number;
  data: PathComponent[];

  constructor(options: WaveOptions) {
    this.x = options.x;
    this.y = options.y;
    this.frequency = options.frequency;
    this.amplitude = options.amplitude;
    this.steps = options.steps;
    this.speed = options.speed ?? 0;
    this.offset = 0;
    this.data = [];
  }

  pathDataToSvgStrings = (): string[] => {
    let lastPos = this.data[0];
    const out: string[] = [];
    for (const pos of this.data) {
      out.push(`M ${lastPos.x} ${lastPos.y} L ${pos.x} ${pos.y}`)
      lastPos = pos;
    }
    return out;
  }

  pathDataToLines = (): Line[] => {
    let lastPos = this.data[0];
    const out: Line[] = [];
    const len = this.data.length;
    for (let i = 0; i < len; i++) {
      const pos = this.data[i];
      const color = hsv.rgb([360 * (i / len), 50, 100]);
      out.push(new Line({
        from: lastPos,
        to: pos,
        color: [color[0] / 256, color[1] / 256, color[2] / 256],
        // blankAfter: true,
        blankBefore: true,
      }))
      lastPos = pos;
    }
    return out;
  }


  pathFunction = (x: number) => (
      Math.sin(
        Math.sqrt(x * (this.frequency * this.steps)) - this.offset
      )
    ) *
    x *
    (/*0.1 **/ this.amplitude);

  update = (timeStep: number) => {
    const STEP_SIZE = 1/this.steps;
    this.offset += timeStep * this.speed;

    this.data = [{
      x: this.x,
      y: this.y
    }];
    for (let x = 0; x < 1; x += STEP_SIZE) {
			this.data.push({
					x: this.x + x,
					y: this.y + this.pathFunction(x),
			});
		}
  }

  draw = () => {
    return this.pathDataToLines();
    // const pathStrings = this.pathDataToSvgStrings();
    // return pathStrings.map((str, i) => new Path({
    //   path: str,
    //   color: [0, i/pathStrings.length, 0],
    // }))
  }

}
