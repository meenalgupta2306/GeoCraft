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

}
