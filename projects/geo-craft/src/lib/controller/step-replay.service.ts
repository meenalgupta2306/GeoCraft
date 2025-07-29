import { Injectable } from '@angular/core';
import { Point } from '../model/point';
import { ToolManagerService } from './tool-manager.service';
import { ConstructionService } from './construction.service';
import { ViewStateService } from '../view/services/view-state.service';
import { GeoCraftViewComponent } from '../view/geo-craft-view/geo-craft-view.component';
import { DrawPoint } from '../drawable/draw-point';
import { DrawSegment } from '../drawable/draw-segment';
import { LineSegment } from '../model/segment';

@Injectable({
  providedIn: 'root',
})
export class StepReplayService {
  private labelMap = new Map<string, Point>();
  private protractorMap = new Map<number, { vertex: string; angle: number }>();

  constructor(
    private toolManager: ToolManagerService,
    private construction: ConstructionService,
    private viewState: ViewStateService
  ) {}
  replayAll(view: GeoCraftViewComponent): void {
    this.viewState.clear();

    for (const geo of this.construction.getGeoElements()) {
      if (geo instanceof Point) {
        this.viewState.addDrawable(new DrawPoint(geo));
      }
      if (geo instanceof LineSegment) {
        this.viewState.addDrawable(new DrawPoint(geo.start));
        this.viewState.addDrawable(new DrawSegment(geo));
        this.viewState.addDrawable(new DrawPoint(geo.end));
      }
     
    }

    view.render();
  }

  async playStep(step: any, view: GeoCraftViewComponent): Promise<void> {
    if (step.tool === 'point') {
      const [x, y] = step.data.coordinate;
      const point = new Point(x, y, step.data.label);
      this.labelMap.set(step.data.label, point);

      this.construction.addGeoElement(point);
      this.viewState.addDrawable(new DrawPoint(point));
    }

    if (step.tool === 'segment') {
      const { start, end } = step.data;

      const startPoint = this.getOrAssumePoint(start);
      let endPoint = this.getOrAssumePoint(end);

      // If this segment depends on an angle (e.g. from protractor)
      if (step.depends?.length && step.data?.angle && !end.coordinate) {
        const protractorStepId = step.depends.find((id: number) =>
          this.protractorMap.has(id)
        );
        if (protractorStepId !== undefined) {
          const { vertex, angle } = this.protractorMap.get(protractorStepId)!;
          const from = this.labelMap.get(vertex)!;
          const base = startPoint.label === vertex ? from : startPoint;
          const reference = startPoint.label === vertex ? this.getOtherPointOfSegment(vertex) : from;

          endPoint = this.constructPointAtAngle(base, reference, step.data?.angle, step.length, end.label);
          this.labelMap.set(end.label, endPoint);
        }
      }

      const segment = new LineSegment(startPoint, endPoint);
      this.labelMap.set(start.label, startPoint);
      this.labelMap.set(end.label, endPoint);

      this.construction.addGeoElement(segment);
      this.viewState.addDrawable(new DrawPoint(startPoint));
      this.viewState.addDrawable(new DrawSegment(segment));
      this.viewState.addDrawable(new DrawPoint(endPoint));
    }

    if (step.tool === 'protractor') {
      const { vertex, angle } = step.data;
      this.protractorMap.set(step.id, { vertex, angle });
    }

    view.render();
  }

  async playAll(steps: any[], view: GeoCraftViewComponent): Promise<void> {
    for (const step of steps) {
      await this.playStep(step, view);
    }
  }

  private getOrAssumePoint(def: any): Point {
    if (this.labelMap.has(def.label)) {
      return this.labelMap.get(def.label)!;
    }
    if (def.coordinate) {
      return new Point(def.coordinate[0], def.coordinate[1], def.label);
    }
    return this.assumeCoordinate(def.label);
  }

  private assumeCoordinate(label: string): Point {
    const assumed = new Point(this.labelMap.size * 2, 0, label);
    this.labelMap.set(label, assumed);
    return assumed;
  }

  private getOtherPointOfSegment(vertex: string): Point {
    for (const segment of this.construction.getGeoElements()) {
      if (segment instanceof LineSegment) {
        if (segment.start.label === vertex) return segment.end;
        if (segment.end.label === vertex) return segment.start;
      }
    }
    throw new Error(`No segment found for vertex ${vertex}`);
  }

  private constructPointAtAngle(
  from: Point,
  base: Point,
  angleDeg: number,
  length: number = 2,
  label: string
): Point {
  debugger
  const dx = base.x - from.x;
  const dy = base.y - from.y;

  const angleRad = (angleDeg * Math.PI) / 180;

  // ✅ Rotate the vector (dx, dy) by +angleRad
  const rotatedDx = Math.cos(angleRad) * dx - Math.sin(angleRad) * dy;
  const rotatedDy = Math.sin(angleRad) * dx + Math.cos(angleRad) * dy;

  const mag = Math.hypot(rotatedDx, rotatedDy) || 1;
  const unitDx = rotatedDx / mag;
  const unitDy = rotatedDy / mag;

  const x = from.x + unitDx * length;
  const y = from.y + unitDy * length;

  // ✅ Clamp or adjust to visible area if needed
  const { minX, maxX, minY, maxY } = this.viewState.getVisibleWorldRange();
  const clampedX = Math.max(minX, Math.min(maxX, x));
  const clampedY = Math.max(minY, Math.min(maxY, y));

  return new Point(clampedX, clampedY, label);
}

}
