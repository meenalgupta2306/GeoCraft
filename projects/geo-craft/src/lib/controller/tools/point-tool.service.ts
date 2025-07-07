import { Injectable, Injector } from '@angular/core';
import { InteractiveTool } from '../interfaces/tools-interface';
import { Point } from '../../model/point';
import { DrawPoint } from '../../drawable/draw-point';
import { ConstructionService } from '../construction.service';
import { EventLogService } from '../event-log.service';
import { ViewStateService } from '../../view/services/view-state.service';
import { GeoCraftViewComponent } from '../../view/geo-craft-view/geo-craft-view.component';
import { ValidationResult } from '../interfaces/validationResult-interface';
import { ValidationService } from '../validation.service';

@Injectable({
  providedIn: 'root',
})
export class PointToolService implements InteractiveTool {
  private previewPoint: DrawPoint | null = null;
  private pointCount = 0;
  private currentLabel: string | null = null;
  private point!: Point;
  private _validationService?: ValidationService;

  constructor(
    private construction: ConstructionService,
    private eventLog: EventLogService,
    private viewState: ViewStateService,
    private injector: Injector // private validationService: ValidationService,
  ) {}

  private get validationService(): ValidationService {
    if (!this._validationService) {
      this._validationService = this.injector.get(ValidationService);
    }
    return this._validationService;
  }

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
    this.validationService.startValidation();
  }

  validate(
    step: any,
    geoElement: any,
    labelSensitive: boolean
  ): ValidationResult {
    const { coordinate, label } = step.data;

    // 1. Coordinate check (only if provided)
    if (coordinate) {
      const dx = geoElement.x - coordinate[0];
      const dy = geoElement.y - coordinate[1];
      const distance = Math.hypot(dx, dy);
      const coordValid = distance <= this.viewState.toleranceFactor;

      if (!coordValid) {
        return {
          matched: false,
          reason: `Let’s check that point ${geoElement.label} again — is it in the right place?`,
        };
      }
    }

    // 2. Label check
    if (labelSensitive) {
      const labelValid = geoElement.label === label;
      if (!labelValid) {
        return {
          matched: false,
          reason:
            'The point is perfectly placed! Could the label be different?',
        };
      }
    }
    return { matched: true };
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

  resetLabelCount(): void {
    this.pointCount = 0;
  }
}
