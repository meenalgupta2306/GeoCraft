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
  readonly toleranceFactor = {
    protractorCenter: 0.05,
    protractorAlignment: 0.06,
    segmentCoordinate: 0.07,
    segmentLength: 0.08,
    segmentAngle: 0.6,
  };

  // ✅ Coordinate system
  screenOriginX = 400; // will be updated dynamically
  screenOriginY = 300; // will be updated dynamically
  screenScaleX = 100; // pixels per real unit in X
  screenScaleY = 100; // pixels per real unit in Y

  worldMinX = -5;
  worldMaxX = 5;
  worldMinY = -5;
  worldMaxY = 5;

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
  private previewDrawables: any[] = [];
  private historyStack: any[][] = [];
  private futureStack: any[][] = []; // optional, for Redo functionality

  errorMessage: Subject<any> = new Subject<String | null>();
  lastElement: Subject<any> = new Subject<any | null>();

  constructor() {}

  addDrawable(drawable: any) {
    this.saveHistory();
    this.drawables.push(drawable);
  }

  getDrawables() {
    return this.drawables;
  }

  saveHistory() {
    const snapshot = this.drawables.map((d) => ({ ...d })); // shallow clone
    this.historyStack.push(snapshot);
    this.futureStack = []; // clear future on new action
  }

  // undo() {
  //   // if (this.historyStack.length === 0) return;
  //   // const lastState = this.historyStack.pop()!;
  //   // this.futureStack.push([...this.drawables]); // for redo (optional)
  //   // this.drawables = lastState;
  //   if (this.drawables.length === 0) return null;
  //   const removed = this.drawables.pop();

  //   // this.coordinateSystemChanged.next(); // or force re-render
  //   return removed;
  // }

  undo(): any | null {
    if (this.drawables.length === 0) return null;
    const removed = this.drawables.pop();

    if ('segment' in removed) {
      const removedPoints = [];

      for (let i = 0; i < 2 && this.drawables.length > 0; i++) {
        const pointCandidate = this.drawables[this.drawables.length - 1];
        if ('point' in pointCandidate) {
          removedPoints.push(this.drawables.pop());
        }
      }
      return [removed, ...removedPoints];
    }
    return removed;
  }

  redo() {
    if (this.futureStack.length === 0) return;

    this.historyStack.push([...this.drawables]);
    this.drawables = this.futureStack.pop()!;
    this.coordinateSystemChanged.next();
  }

  clear() {
    this.drawables = [];
    this.previewDrawables = [];
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
    return (screenX - this.screenOriginX) / this.screenScaleX;
  }

  toWorldY(screenY: number): number {
    return (this.screenOriginY - screenY) / this.screenScaleY;
  }

  setPreviewDrawables(items: any[]): void {
    this.previewDrawables = items;
  }

  addPreviewDrawable(item: any) {
    this.previewDrawables.push(item);
  }

  clearPreviewDrawables(): void {
    this.previewDrawables = [];
  }

  getPreviewDrawables(): any[] {
    return this.previewDrawables;
  }
  get tolerance(): number {
    return this.gridStep;
  }
  getVisibleWorldRange() {
    const minX = this.toWorldX(0);
    const maxX = this.toWorldX(this.canvasWidth);
    const minY = this.toWorldY(this.canvasHeight);
    const maxY = this.toWorldY(0);

    return { minX, maxX, minY, maxY };
  }

  emitmessage(msg: string | null) {
    this.errorMessage.next(msg);
  }

  validateLastElement(type: string) {
    const lastElement = this.getDrawables();
    this.lastElement.next({lastElement: lastElement[lastElement.length - 1], type: type });
  }
}
