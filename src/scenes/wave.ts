import { Line } from '@laser-dac/draw';

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

  pathDataToLines = (): Line[] => {
    let lastPos = this.data[0];
    const out: Line[] = [];
    const len = this.data.length;
    for (let i = 0; i < len; i++) {
      const pos = this.data[i];
      out.push(new Line({
        from: lastPos,
        to: pos,
        color: [1, 1, 1],
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
    x * this.amplitude;

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
  }

}
