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
  private pointCount = 0;
  private currentLabel: string | null = null;
  private point!: Point;

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
    this.currentLabel = this.getNextLabel();
    this.point = new Point(x, y, this.currentLabel);
    const drawPoint = new DrawPoint(this.point);
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

    this.construction.addGeoElement(this.point);
    this.eventLog.record({ tool: 'PointTool', x, y, label: this.currentLabel });

    this.previewPoint.setGlow(false);

    this.previewPoint = null;
    view.render();
  }

  validate(step: any, labelSensitive: boolean) {

    //Skip validation if no id or no coordinate is given (treat as implicitly valid)
    if(!step?.id || !step?.data?.coordinate || !step) return ;

    const { id, data } = step;  

    const point = this.construction.getLastGeoElement();

    const [x, y] = data.coordinate;
    const dx = point.x - x;
    const dy = point.y - y;
    const distance = Math.hypot(dx, dy);
    const coordValid = distance <= this.viewState.toleranceFactor;

    const labelValid = labelSensitive ? point.label === data.label : true;

    const isValid = coordValid && labelValid;

    if (isValid) {
      //alert('validated');
      this.stepEvaluator.markStepAsCompleted(id);
    } else {
      this.viewState.emitmessage(`${!coordValid? 'Let’s check that point again — is it in the right place?': 'The point is perfectly placed! Could the label be different?'}`)
    }
  }
  getNextLabel(): string {
    const cycle = Math.floor(this.pointCount / 26);
    const index = this.pointCount % 26;

    let label = String.fromCharCode(65 + index); // A-Z

    if (cycle > 0) {
      label += `'`.repeat(cycle);
    }

    this.pointCount++;
    return label;
  }
}
