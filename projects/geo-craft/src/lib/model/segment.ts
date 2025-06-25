import { Point } from './point';


export class LineSegment {
    constructor(
    public start: Point,
    public end: Point
  ) {}

   getLength(): number {
    const dx = this.end.x - this.start.x;
    const dy = this.end.y - this.start.y;
    return Math.hypot(dx, dy);
  }

  getMidpoint(): Point {
    const mx = (this.start.x + this.end.x) / 2;
    const my = (this.start.y + this.end.y) / 2;
    return new Point(mx, my);
  }


}