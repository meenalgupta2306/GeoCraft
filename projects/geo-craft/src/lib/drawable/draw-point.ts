import { Point } from '../model/point';
import { FabricRendererService } from '../view/services/fabric-renderer.service';
import { config } from '../config/default-styles.json';
import { GeoRef } from '../controller/interfaces/geoRef';
import { fabric } from 'fabric';

export class DrawPoint {
  private isGlowing: boolean = false;
  private isSelected: boolean = false;
  private _fabricObject: any;
  private pointCircle?: fabric.Circle;
  private glowCircle?: fabric.Circle;
  private labelText?: fabric.Text;

  constructor(private point: Point, private isTemporary: boolean = false) {}

  render(renderer: FabricRendererService, view: GeoRef) {
    const x = view.toScreenX(this.point.x);
    const y = view.toScreenY(this.point.y);

    if (this.isGlowing || this.isSelected) {
      if (!this.glowCircle) {
        this.glowCircle = renderer.drawCircle(
          x,
          y,
          config.point.glow.radius,
          true
        );
      } else {
        this.glowCircle.set({
          left: x - config.point.glow.radius,
          top: y - config.point.glow.radius,
        });
        this.glowCircle.setCoords();
      }
    } else if (this.glowCircle) {
      renderer.canvas.remove(this.glowCircle);
      this.glowCircle = undefined;
    }

    if (!this.pointCircle) {
      this.pointCircle = renderer.drawCircle(x, y, config.point.radius, false);
      this._fabricObject = this.pointCircle;
    } else {
      this.pointCircle.set({
        left: x - config.point.radius,
        top: y - config.point.radius,
      });
      this.pointCircle.setCoords();
    }

    if (this.point.label) {
      if (!this.labelText) {
        this.labelText = renderer.drawText(this.point.label, x + 8, y - 8);
      } else {
        this.labelText.set({
          left: x + 8,
          top: y - 8,
        });
        this.labelText.setCoords();
      }
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

  updateStroke(renderer: FabricRendererService, view: GeoRef, type: string) {
    if (this.pointCircle) {
      this.pointCircle.set({
        stroke: type,
        fill: type,
      });
      this.pointCircle.setCoords();
    }
    renderer.canvas.requestRenderAll();
  }

  dispose(renderer: FabricRendererService) {
    if (this.pointCircle) {
      renderer.removeObject(this.pointCircle);
      this.pointCircle = undefined;
    }
    if (this.glowCircle) {
      renderer.removeObject(this.glowCircle);
      this.glowCircle = undefined;
    }
    if (this.labelText) {
      renderer.removeObject(this.labelText);
      this.labelText = undefined;
    }
  }
}
