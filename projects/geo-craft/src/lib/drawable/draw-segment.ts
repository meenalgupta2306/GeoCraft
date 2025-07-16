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

    const strokeColor = this.isPreview ? '#888' : '#000';
    const fillColor = this.isPreview ? '#aaa' : '#000';
    const lineWidth = this.isPreview ? 1 : 2;

    if (!this.lineObj) {
      this.lineObj = renderer.drawLine(x1, y1, x2, y2, strokeColor, lineWidth);
      this._fabricObject = this.lineObj;
    } else {
      this.lineObj.set({
        x1,
        y1,
        x2,
        y2,
        stroke: strokeColor,
        strokeWidth: lineWidth,
      });
      this.lineObj.setCoords();
      this._fabricObject = this.lineObj;
    }
  }

  updateStroke(renderer: FabricRendererService, view: GeoRef, type: string) {
    if (this.lineObj) {
      this.lineObj.set({ stroke: type });
      this.lineObj.setCoords();
      renderer.canvas.requestRenderAll();
    }
  }

  dispose(renderer: FabricRendererService) {
    console.log('Disposing segment...');

    if (this.lineObj) {
      renderer.canvas.remove(this.lineObj);
      this.lineObj = undefined;
    }
    renderer.canvas.requestRenderAll();
  }
}
