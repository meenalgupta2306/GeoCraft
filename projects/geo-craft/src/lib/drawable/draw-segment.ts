import { LineSegment } from '../model/segment';
import { FabricRendererService } from '../view/services/fabric-renderer.service';
import { GeoRef } from '../controller/interfaces/geoRef';
import { fabric } from 'fabric';

export class DrawSegment {
  private lineObj?: fabric.Line;
  private _fabricObject: any;

  constructor(
    private segment: LineSegment,
    private isPreview: boolean = false
  ) {}

  render(renderer: FabricRendererService, view: GeoRef) {
    const { start, end } = this.segment;

    const x1 = view.toScreenX(start.x);
    const y1 = view.toScreenY(start.y);
    const x2 = view.toScreenX(end.x);
    const y2 = view.toScreenY(end.y);

    const strokeColor = '#000';
    const lineWidth = 2;

    if (!this.lineObj) {
      if (!this.isPreview) {
        this.lineObj = renderer.drawLine(
          x1,
          y1,
          x2,
          y2,
          strokeColor,
          lineWidth
        );
        this._fabricObject = this.lineObj;
      }
    } else {
      this.lineObj.set({
        x1,
        y1,
        x2,
        y2,
      });
      this.lineObj.setCoords();
      this._fabricObject = this.lineObj;
    }
  }

  updateStroke(renderer: FabricRendererService, view: GeoRef, type: string) {
    if (this.lineObj) {
      this.lineObj.set({ stroke: type, fill: type });
      this.lineObj.setCoords();
      renderer.canvas.requestRenderAll();
    }
  }

  dispose(renderer: FabricRendererService) {
    console.log('Disposing segment...');

    if (this.lineObj) {
      renderer.removeObject(this.lineObj);
      renderer.canvas.requestRenderAll();
    }
  }
}
