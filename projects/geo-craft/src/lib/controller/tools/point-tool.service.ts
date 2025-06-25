import { Injectable } from '@angular/core';
import { Tool } from './tools-interface';
import { Point } from '../../model/point';
import { DrawPoint } from '../../drawable/draw-point';
import { ConstructionService } from '../construction.service';
import { EventLogService } from '../event-log.service';
import { ViewStateService } from '../../view/services/view-state.service';
import { GeoCraftViewComponent } from '../../view/geo-craft-view/geo-craft-view.component';

@Injectable({
  providedIn: 'root'
})
export class PointToolService implements Tool {
  private previewPoint: DrawPoint | null = null;


  constructor(
    private construction: ConstructionService,
    private eventLog: EventLogService,
    private viewState: ViewStateService
  ) { }


 handleClick(view: any, x: number, y: number) {
    // 1️⃣ Snap if enabled
    if (this.viewState.snapToGrid) {
      const step = this.viewState.gridStep;
      x = Math.round(x / step) * step;
      y = Math.round(y / step) * step;
    }

    // 2️⃣ Check for duplicate point
    const exists = this.construction.getGeoElements().some(e => {
      return e instanceof Point && e.distanceTo(x, y) < 1e-6;
    });

    if (exists) {
      console.log('Point already exists at', x, y);
      return; 
    }

    // 3️⃣ Create and add new point
    const point = new Point(x, y);
    this.construction.addGeoElement(point);

    this.eventLog.record({ tool: 'PointTool', x, y });

    const drawable = new DrawPoint(point);
    this.viewState.addDrawable(drawable);
  }

  handleMove(view: GeoCraftViewComponent, wx: number, wy: number): void {
      
  }
   // 👇 Called when pen/finger pressed down
  handlePointerDown(view: GeoCraftViewComponent, x: number, y: number): void {
    if (this.viewState.snapToGrid) {
      const step = this.viewState.gridStep;
      x = Math.round(x / step) * step;
      y = Math.round(y / step) * step;
    }

    const point = new Point(x, y);
    const drawPoint = new DrawPoint(point);
    drawPoint.setGlow(true); // 💫 Outer ring shown while holding

    this.previewPoint = drawPoint;
    this.viewState.addDrawable(drawPoint);
    view.render();
  }

  // 👇 Called when pen/finger is lifted
  handlePointerUp(view: GeoCraftViewComponent, x: number, y: number): void {
    if (!this.previewPoint) return;

    if (this.viewState.snapToGrid) {
      const step = this.viewState.gridStep;
      x = Math.round(x / step) * step;
      y = Math.round(y / step) * step;
    }

    // Check for duplicates
    const exists = this.construction.getGeoElements().some(e => {
      return e instanceof Point && e.distanceTo(x, y) < 1e-6;
    });

    if (exists) {
      // Remove temporary point if duplicate
      this.viewState.clearPreviewDrawables();
      this.previewPoint = null;
      view.render();
      return;
    }

    // Confirm point creation
    const point = new Point(x, y);
    this.construction.addGeoElement(point);
    this.eventLog.record({ tool: 'PointTool', x, y });

    this.previewPoint.setGlow(false); // 🧼 Remove glow ring
    this.previewPoint = null;
    view.render();
  }


}
