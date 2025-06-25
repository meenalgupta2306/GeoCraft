import { Injectable } from '@angular/core';
import { config } from './config/default-styles.json';

@Injectable({
  providedIn: 'root',
})
export class CanvasRendererService {
  private ctx!: CanvasRenderingContext2D;

  constructor() {}
  setContext(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  clear(width: number, height: number) {
    this.ctx.clearRect(0, 0, width, height);
  }

  drawCircle(x: number, y: number, radius: number, glow?: boolean) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);

    if (glow) {
      this.ctx.fillStyle = config.point.glow.fillStyle; 
      this.ctx.fill();

      this.ctx.strokeStyle = config.point.glow.strokeStyle;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    } else {
      this.ctx.fillStyle = config.point.fillStyle; 
      this.ctx.fill();
    }

  }

  drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string = 'black'
  ) {
    if (this.ctx) {
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.strokeStyle = color;
      this.ctx.stroke();
    }
  }

  setStrokeStyle(color: string) {
    this.ctx.strokeStyle = color;
  }

  setLineWidth(width: number) {
    this.ctx.lineWidth = width;
  }
  drawText(text: string, x: number, y: number) {
    this.ctx.fillText(text, x, y);
  }

  setFillStyle(color: string) {
    this.ctx.fillStyle = color;
  }

  setFont(font: string) {
    this.ctx.font = font;
  }
}
