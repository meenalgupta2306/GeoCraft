import { LineSegment } from "../model/segment";
import { CanvasRendererService } from "../view/services/canvas-renderer.service";
import { GeoCraftViewComponent } from "../view/geo-craft-view/geo-craft-view.component";

export class DrawSegment {
  constructor(private segment: LineSegment, private isPreview: boolean = false) {
  }

 render(renderer: CanvasRendererService, view: GeoCraftViewComponent) {
    const { start, end } = this.segment;

    const x1 = view.toScreenX(start.x);
    const y1 = view.toScreenY(start.y);
    const x2 = view.toScreenX(end.x);
    const y2 = view.toScreenY(end.y);

    // Draw the segment line
    renderer.setStrokeStyle(this.isPreview ? '#888' : '#000');
    renderer.setLineWidth(this.isPreview ? 1 : 2);
    renderer.drawLine(x1, y1, x2, y2);

    // Draw endpoints as filled circles
    renderer.setFillStyle(this.isPreview ? '#aaa' : '#000');
    renderer.drawCircle(x1, y1, 3);
    renderer.drawCircle(x2, y2, 3);
  }
}