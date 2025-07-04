import { Point } from './point';
import { LineSegment } from './segment';
export class Protractor {
  readonly tool = 'protractor';
  constructor(
    public center: Point,
    public protractorAxis: LineSegment, // public rotation: number = 0, // in radians
    public baseSegment?: LineSegment
  ) {}
  public getCenter() {
    return this.center;
  }

  public getBaseSegment() {
    return this.baseSegment;
  }

  public getProtractorAxis() {
    return this.protractorAxis;
  }
}
