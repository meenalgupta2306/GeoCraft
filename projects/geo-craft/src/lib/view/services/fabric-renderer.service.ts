import { Injectable } from '@angular/core';
import { config } from '../../config/default-styles.json';
declare const fabric: any;
@Injectable({
  providedIn: 'root',
})
export class FabricRendererService {
  canvas: any;
  constructor() {}

  setCanvas(canvas: any) {
    this.canvas = canvas;
  }

  clear() {
    this.canvas.clear();
  }

  drawCircle(x: number, y: number, radius: number, glow?: boolean) {
    const fillStyle = glow
      ? config.point.glow.fillStyle
      : config.point.fillStyle;
    const strokeStyle = glow ? config.point.glow.strokeStyle : undefined;

    const circle = new fabric.Circle({
      left: x - radius,
      top: y - radius,
      radius: radius,
      fill: fillStyle,
      stroke: strokeStyle,
      strokeWidth: glow ? 2 : 0,
      selectable: false,
      evented: false,
    });

    this.canvas.add(circle);
    return circle;
  }

  drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string = 'black',
    width: number = 1
  ) {
    const line = new fabric.Line([x1, y1, x2, y2], {
      stroke: color,
      strokeWidth: width,
      selectable: false,
      evented: false,
    });
    this.canvas.add(line);
    return line;
  }

  drawText(text: string, x: number, y: number) {
    const label = new fabric.Text(text, {
      left: x,
      top: y,
      fontSize: 14,
      fill: 'black',
      selectable: false,
      evented: false,
      originX: 'left',
      originY: 'center',
    });

    this.canvas.add(label);
    return label;
  }

  setStrokeStyle(color: string) {
    // Fabric sets stroke on a per-object basis
    console.warn(
      'setStrokeStyle is not global in Fabric. Use drawLine() with color instead.'
    );
  }

  setLineWidth(width: number) {
    // Fabric sets strokeWidth per-object
    console.warn(
      'setLineWidth is not global in Fabric. Use drawLine() with width instead.'
    );
  }

  setFillStyle(color: string) {
    // Fabric sets fill per-object
    console.warn(
      'setFillStyle is not global in Fabric. Use drawCircle() or drawText() with fill instead.'
    );
  }

  setFont(font: string) {
    // You could implement this via a class-level variable if needed
    console.warn(
      'setFont is not supported globally in Fabric. Pass font via drawText if needed.'
    );
  }
}
