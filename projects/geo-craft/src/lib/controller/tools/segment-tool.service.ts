import { Injectable, Injector } from '@angular/core';
import { Tool } from '../interfaces/tools-interface';
import { Point } from '../../model/point';
import { ConstructionService } from '../construction.service';
import { ViewStateService } from '../../view/services/view-state.service';
import { LineSegment } from '../../model/segment';
import { GeoCraftViewComponent } from '../../view/geo-craft-view/geo-craft-view.component';
import { DrawSegment } from '../../drawable/draw-segment';
import { DrawPoint } from '../../drawable/draw-point';
import { PointToolService } from './point-tool.service';
import { ValidationResult } from '../interfaces/validationResult-interface';
import { ValidationService } from '../validation.service';

@Injectable({
  providedIn: 'root',
})
export class SegmentToolService implements Tool {
  private startPoint: Point | null = null;
  private endPoint: Point | null = null;
  private segment: LineSegment | null = null;
  private _validationService?: ValidationService;

  private previewStartPoint: DrawPoint | null = null;
  private previewEndPoint: DrawPoint | null = null;

  constructor(
    private constructionService: ConstructionService,
    private viewStateService: ViewStateService,
    private pointToolService: PointToolService,
    private injector: Injector
  ) {}

  private get validationService(): ValidationService {
    if (!this._validationService) {
      this._validationService = this.injector.get(ValidationService);
    }
    return this._validationService;
  }

  handlePointerDown(view: GeoCraftViewComponent, x: number, y: number): void {
    // const label = this.pointToolService.getNextLabel();
    let point = this.findNearbyPoint(x, y);
    if (!point) {
      const label = this.pointToolService.getNextLabel();
      point = new Point(x, y, label);
      this.constructionService.addGeoElement(point); // Don't forget to add new point
    }

    if (!this.startPoint) {
      // First point: start a segment
      this.startPoint = point;
      this.previewStartPoint = new DrawPoint(point);
      this.previewStartPoint.setGlow(true);
      this.viewStateService.addPreviewDrawable(this.previewStartPoint);
    } else {
      // Second point: store segment for confirmation on pointerup
      this.endPoint = point;
      this.previewEndPoint = new DrawPoint(point);
      this.previewEndPoint.setGlow(true);

      this.segment = new LineSegment(this.startPoint, this.endPoint);

      // Add preview segment only (not final yet)
      this.viewStateService.setPreviewDrawables([
        this.previewStartPoint!,
        new DrawSegment(this.segment, true),
        this.previewEndPoint,
      ]);
    }

    view.render();
  }

  handlePointerUp(view: GeoCraftViewComponent): void {
    // If only one point tapped, do nothing
    if (!this.segment || !this.previewEndPoint || !this.previewStartPoint)
      return;

    // Finalize segment
    this.constructionService.addGeoElement(this.segment);

    // Remove glow
    this.previewStartPoint.setGlow(false);
    this.previewEndPoint.setGlow(false);

    // Clear preview and add final drawables
    this.viewStateService.clearPreviewDrawables();

    [
      this.previewStartPoint,
      new DrawSegment(this.segment),
      this.previewEndPoint,
    ].forEach((item) => {
      this.viewStateService.addDrawable(item);
    });

    //reset
    this.startPoint = null;
    this.endPoint = null;
    this.segment = null;
    this.previewStartPoint = null;
    this.previewEndPoint = null;

    view.render();
  }

  cancel(): void {
    this.startPoint = null;
    this.viewStateService.clearPreviewDrawables();
  }

  validate(
    step: any,
    geoElement: any,
    labelSensitive: boolean
  ): ValidationResult {
    debugger;
    if (!step?.id || !step.data) {
      return {
        matched: false,
        reason: `No segment found`,
      };
    }

    const { id, data } = step;
    if (!geoElement) {
      return {
        matched: false,
        reason: `No segment found`,
      };
    }

    const { start, end } = geoElement;
    const epsilon = this.viewStateService.toleranceFactor;

    const coordMatch = (point: any, expected?: number[]) =>
      !expected ||
      Math.hypot(point.x - expected[0], point.y - expected[1]) <= epsilon;

    const labelMatch = (point: any, expectedLabel?: string) =>
      !labelSensitive || !expectedLabel || point.label === expectedLabel;

    const expectedStart = data.start?.coordinate;
    const expectedEnd = data.end?.coordinate;
    const expectedStartLabel = data.start?.label;
    const expectedEndLabel = data.end?.label;

    const isMatch =
      (coordMatch(start, expectedStart) &&
        coordMatch(end, expectedEnd) &&
        labelMatch(start, expectedStartLabel) &&
        labelMatch(end, expectedEndLabel)) ||
      (coordMatch(start, expectedEnd) &&
        coordMatch(end, expectedStart) &&
        labelMatch(start, expectedEndLabel) &&
        labelMatch(end, expectedStartLabel));

    let lengthValid = true;
    if (typeof data.length === 'number') {
      const segmentLength = geoElement.getLength();
      lengthValid = Math.abs(segmentLength - data.length) <= epsilon;
      console.log(
        `📏 Length check: expected ${data.length}, got ${segmentLength.toFixed(2)}`
      );
    }

    let angleValid = true;
    if (data.angle !== undefined) {
      //logic after fetching the segment needed by the dependency factor of the config.
    }

    const isValid = isMatch && lengthValid && angleValid;

    if (isValid) {
      return {
        matched: true,
      };
    } else {
      return {
        matched: false,
        reason: `Segment is not appropriate`,
      };
    }
  }

  computeAngleBetweenSegments(seg1: any, seg2: any, angle: any, operator: any) {
    const dx1 = seg1.end.x - seg1.start.x;
    const dy1 = seg1.end.y - seg1.start.y;
    const dx2 = seg2.end.x - seg2.start.x;
    const dy2 = seg2.end.y - seg2.start.y;

    const dot = dx1 * dx2 + dy1 * dy2;
    const mag1 = Math.hypot(dx1, dy1);
    const mag2 = Math.hypot(dx2, dy2);
    const cosTheta = dot / (mag1 * mag2);

    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
    const degree = (angleRad * 180) / Math.PI;
    let angleValid = true;
    switch (operator) {
      case '=':
        angleValid = Math.abs(degree - angle) <= 2;
        break;
      case '>':
        angleValid = degree > angle;
        break;
      case '<':
        angleValid = degree < angle;
        break;
      default:
        angleValid = true;
    }
    return angleValid;
  }
  
  private findNearbyPoint(
    x: number,
    y: number,
    tolerance = 0.25
  ): Point | null {
    const allPoints = this.constructionService
      .getGeoElements()
      .filter((e): e is Point => e instanceof Point);

    for (const pt of allPoints) {
      const dx = pt.x - x;
      const dy = pt.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= tolerance) {
        return pt;
      }
    }
    return null;
  }
}
