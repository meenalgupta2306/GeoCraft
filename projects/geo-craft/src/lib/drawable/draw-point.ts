import { Point } from '../model/point';
import { CanvasRendererService } from '../view/services/canvas-renderer.service';
import { config } from '../config/default-styles.json';
import { GeoRef } from '../controller/interfaces/geoRef';
export class DrawPoint {
  private isGlowing: boolean = false;
  private isSelected: boolean = false;

  constructor(private point: Point, private isTemporary: boolean = false) {}

  render(renderer: CanvasRendererService, view: GeoRef) {
    const x = view.toScreenX(this.point.x);
    const y = view.toScreenY(this.point.y);

    if (this.isGlowing || this.isSelected) {
      renderer.drawCircle(x, y, config.point.glow.radius, true);
    }

    renderer.drawCircle(x, y, config.point.radius);

    if (this.point.label) {
      renderer.drawText(this.point.label, x + 8, y - 8);
    }
  }
  setGlow(active: boolean) {
    this.isGlowing = active;
  }

  setSelected(selected: boolean) {
    this.isSelected = selected;
  }

  getPoint(): Point {
    return this.point;
  }
}
