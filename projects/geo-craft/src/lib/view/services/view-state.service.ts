import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ViewStateService {
  // ✅ Grid settings
  showGrid = true;
  snapToGrid = false;
  gridStep = 1;

  // ✅ Coordinate system
  screenOriginX = 400; // will be updated dynamically
  screenOriginY = 300; // will be updated dynamically
  screenScaleX = 100; // pixels per real unit in X
  screenScaleY = 100; // pixels per real unit in Y

  // ✅ Canvas dimensions (for SVG to sync)
  canvasWidth!: number;
  canvasHeight!: number;

  // ✅ Coordinate system change notification
  private coordinateSystemChanged = new Subject<void>();
  coordinateSystemChanged$ = this.coordinateSystemChanged.asObservable();

  // ✅ Any additional config
  canvasConfig: any;

  // ✅ Drawables collection
  private drawables: any[] = [];

  constructor() {}

  // ✅ API to manage drawables
  addDrawable(drawable: any) {
    this.drawables.push(drawable);
  }

  getDrawables() {
    return this.drawables;
  }

  clear() {
    this.drawables = [];
  }

  setCanvasConfig(config: any) {
    this.canvasConfig = config;
  }

  getCanvasConfig() {
    return this.canvasConfig;
  }

  // ✅ Update coordinate system and notify components
  updateCoordinateSystem(
    originX: number,
    originY: number,
    width: number,
    height: number
  ) {
    this.screenOriginX = originX;
    this.screenOriginY = originY;
    this.canvasWidth = width;
    this.canvasHeight = height;

    // Notify all components that coordinate system has changed
    this.coordinateSystemChanged.next();
  }

  // ✅ Core conversion: Real World <=> Screen Pixels
  toScreenX(xRW: number): number {
    return this.screenOriginX + xRW * this.screenScaleX;
  }

  toScreenY(yRW: number): number {
    return this.screenOriginY - yRW * this.screenScaleY;
  }

  toWorldX(screenX: number): number {
    console.log(screenX, this.screenOriginX);

    return (screenX - this.screenOriginX) / this.screenScaleX;
  }

  toWorldY(screenY: number): number {
    return (this.screenOriginY - screenY) / this.screenScaleY;
  }
}
