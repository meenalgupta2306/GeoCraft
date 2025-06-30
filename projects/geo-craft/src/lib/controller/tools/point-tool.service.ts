import { Injectable } from '@angular/core';
import { Tool } from './tools-interface';
import { Point } from '../../model/point';
import { DrawPoint } from '../../drawable/draw-point';
import { ConstructionService } from '../construction.service';
import { EventLogService } from '../event-log.service';
import { ViewStateService } from '../../view/services/view-state.service';
import { GeoCraftViewComponent } from '../../view/geo-craft-view/geo-craft-view.component';
import { StepEvaluatorService } from '../step-evaluator.service';
import { ToolManagerService } from '../tool-manager.service';

@Injectable({
  providedIn: 'root',
})
export class PointToolService implements Tool {
  private previewPoint: DrawPoint | null = null;

  constructor(
    private construction: ConstructionService,
    private eventLog: EventLogService,
    private viewState: ViewStateService,
    private stepEvaluator: StepEvaluatorService
  ) {}

  private pointExists(x: number, y: number): boolean {
    return this.construction
      .getGeoElements()
      .some((e) => e instanceof Point && e.distanceTo(x, y) < 1e-6);
  }

  // Called when pen/finger touches down: show glowing preview
  handlePointerDown(view: GeoCraftViewComponent, x: number, y: number): void {
    const point = new Point(x, y);
    const drawPoint = new DrawPoint(point);
    drawPoint.setGlow(true);

    this.previewPoint = drawPoint;
    this.viewState.addDrawable(drawPoint);
    view.render();
  }

  // Called when pen/finger lifts: confirm or cancel creation
  handlePointerUp(view: GeoCraftViewComponent, x: number, y: number): void {
    if (!this.previewPoint) return;

    // If a point already exists nearby, cancel the preview
    if (this.pointExists(x, y)) {
      this.viewState.clearPreviewDrawables();
      this.previewPoint = null;
      view.render();
      return;
    }

    // Commit new Point to the construction
    const realPoint = new Point(x, y);
    this.construction.addGeoElement(realPoint);
    this.eventLog.record({ tool: 'PointTool', x, y });

    this.previewPoint.setGlow(false);

    this.previewPoint = null;
    view.render();
  }

  validate(stepId: number, params: any, labelSensitive: boolean) {
    // If no coordinate to compare, accept any point
    debugger;
    let isValid;
    isValid = (stepId && !params?.coordinate);

    if (stepId) {
      const [x, y] = params?.coordinate;

      const point = this.construction.getLastGeoElement();
      const dx = point.x - x;
      const dy = point.y - y;
      debugger;
      const distance = Math.hypot(dx, dy);

      isValid = distance <= this.viewState.toleranceFactor;
      if (isValid) {
        alert('validated');
        this.stepEvaluator.markStepAsCompleted(stepId);
      } else {
        alert('not correct');
      }
    }
  }
}
