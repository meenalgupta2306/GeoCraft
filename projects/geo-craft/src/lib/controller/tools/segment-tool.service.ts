import { Injectable, Injector } from '@angular/core';
import { InteractiveTool } from '../interfaces/tools-interface';
import { Point } from '../../model/point';
import { ConstructionService } from '../construction.service';
import { ViewStateService } from '../../view/services/view-state.service';
import { LineSegment } from '../../model/segment';
import { DrawSegment } from '../../drawable/draw-segment';
import { DrawPoint } from '../../drawable/draw-point';
import { PointToolService } from './point-tool.service';
import { ValidationResult } from '../interfaces/validationResult-interface';
import { ValidationService } from '../validation.service';
import { GeoRef } from '../interfaces/geoRef';

@Injectable({
  providedIn: 'root',
})
export class SegmentToolService implements InteractiveTool {
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

  reset() {
    this.startPoint = null;
    this.endPoint = null;
    this.segment = null;
    this.previewStartPoint = null;
    this.previewEndPoint = null;
  }

  handlePointerDown(view: GeoRef, x: number, y: number): void {
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
    this.validationService.startValidation();
  }

  handlePointerUp(view: GeoRef): void {
    // If only one point tapped, do nothing
    if (!this.segment || !this.previewEndPoint || !this.previewStartPoint)
      return;

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
    this.validationService.startValidation();
  }

  cancel(): void {
    this.startPoint = null;
    this.viewStateService.clearPreviewDrawables();
  }

  validate(
    step: any,
    geoElement: LineSegment,
    labelSensitive: boolean
  ): ValidationResult {
    let reason = '';

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
      Math.hypot(point.x - expected[0], point.y - expected[1]) <=
        epsilon.segmentCoordinate;

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
      lengthValid =
        Math.abs(segmentLength - data.length) <= epsilon.segmentLength;
    }

    let angleValid = false;
    if (data.angle !== undefined) {
      //logic after fetching the segment needed by the dependency factor of the config.
      const refSegment = this.validationService.getGeoElementByStepId(
        step.depends?.[0]
      );
      if (!refSegment.baseSegment) {
        return {
          matched: false,
          reason: `No line found`,
        };
      }
      const angle = data.angle;
      const operator = data.operator || '=';

      angleValid = this.computeAngleBetweenSegments(
        refSegment.baseSegment,
        geoElement,
        angle,
        operator
      );
    } else {
      angleValid = true; // No angle check if not specified
    }
    if (!isMatch) {
      reason = `Looks like the points of your segment aren’t quite right. Try placing them more accurately and check if the point names match the instructions.`;
    } else if (!lengthValid) {
      reason = `The length of your segment should be around ${data.length.toFixed(
        2
      )} cm. Try adjusting it.`;
    } else if (!angleValid) {
      reason = `The angle of your segment should be around ${data.angle} degrees. Try adjusting it.`;
    }

    const isValid = isMatch && lengthValid && angleValid;

    if (isValid) {
      return {
        matched: true,
        reason: `✅ Great job! The segment looks perfect.`,
      };
    } else {
      return {
        matched: false,
        reason: reason,
      };
    }
  }

  computeAngleBetweenSegments(
    seg1: any,
    seg2: any,
    expectedAngle: number,
    operator: string = '='
  ): boolean {
    const epsilon = this.viewStateService.toleranceFactor;
    const inaccuracy = epsilon.segmentAngle; // degrees

    const isSamePoint = (p1: any, p2: any): boolean => {
      return (
        Math.abs(p1.x - p2.x) < epsilon.segmentCoordinate &&
        Math.abs(p1.y - p2.y) < epsilon.segmentCoordinate
      );
    };

    // Step 1: Find common point
    let common: any = null;
    let other1: any = null;
    let other2: any = null;

    if (isSamePoint(seg1.start, seg2.start)) {
      common = seg1.start;
      other1 = seg1.end;
      other2 = seg2.end;
    } else if (isSamePoint(seg1.start, seg2.end)) {
      common = seg1.start;
      other1 = seg1.end;
      other2 = seg2.start;
    } else if (isSamePoint(seg1.end, seg2.start)) {
      common = seg1.end;
      other1 = seg1.start;
      other2 = seg2.end;
    } else if (isSamePoint(seg1.end, seg2.end)) {
      common = seg1.end;
      other1 = seg1.start;
      other2 = seg2.start;
    } else {
      return false;
    }

    // Step 2: Compute angle
    const dx1 = other1.x - common.x;
    const dy1 = other1.y - common.y;
    const dx2 = other2.x - common.x;
    const dy2 = other2.y - common.y;

    const dot = dx1 * dx2 + dy1 * dy2;
    const mag1 = Math.hypot(dx1, dy1);
    const mag2 = Math.hypot(dx2, dy2);

    if (mag1 === 0 || mag2 === 0) {
      return false;
    }

    const cosTheta = dot / (mag1 * mag2);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
    const actualAngle = (angleRad * 180) / Math.PI;

    // Step 3: Validate angle
    switch (operator) {
      case '=':
        return Math.abs(actualAngle - expectedAngle) <= inaccuracy;
      case '>':
        return actualAngle > expectedAngle - inaccuracy;
      case '<':
        return actualAngle < expectedAngle + inaccuracy;
      default:
        return false;
    }
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
