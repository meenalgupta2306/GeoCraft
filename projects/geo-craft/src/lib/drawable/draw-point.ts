import { Point } from '../model/point';
import { CanvasRendererService } from '../view/services/canvas-renderer.service';
import { GeoCraftViewComponent } from '../view/geo-craft-view/geo-craft-view.component';
import {config} from '../config/default-styles.json';
export class DrawPoint {
  private isGlowing: boolean = false;
  private isSelected: boolean = false;

  constructor(private point: Point, private isTemporary: boolean = false) {}

  render(renderer: CanvasRendererService, view: GeoCraftViewComponent) {
    const x = view.toScreenX(this.point.x);
    const y = view.toScreenY(this.point.y);

    if (this.isGlowing || this.isSelected) {
      renderer.drawCircle(x, y, config.point.glow.radius, true);
    }

    renderer.drawCircle(x, y, config.point.radius); 
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
