import { Injectable } from '@angular/core';
import { Point } from '../model/point';
import { LineSegment } from '../model/segment';
import { Protractor } from '../model/protractor';
import { ConstructionService } from './construction.service';
import { ViewStateService } from '../view/services/view-state.service';

@Injectable({
  providedIn: 'root',
})
export class ConfigMapperService {
  private labelMap = new Map<string, Point>();
  private completedStepMap = new Map<number, number>();

  private angleConstructorMap: Record<string, (base: number) => number> = {
    '=': (base) => base,
    '>': (base) => base + 10 + Math.random() * 10,
    '<': (base) => base - 10 - Math.random() * 10,
  };

  defaultlength = 3;

  constructor(
    private construction: ConstructionService,
    private viewState: ViewStateService
  ) {}

  placeFigureCentered(configSteps: any[]): void {
    this.labelMap.clear();
    this.completedStepMap.clear();
    this.construction.clear();

    const bbox = this.computeBoundingBox(configSteps);
    const { centerX, centerY } = this.viewState.getVisibleWorldCenter();
    const startLabel = this.findFirstPointLabel(configSteps) ?? 'A';

    const firstPoint = new Point(
      centerX + bbox.horizontalShift,
      centerY + bbox.verticalShift,
      startLabel
    );
    this.labelMap.set(startLabel, firstPoint);

    for (const step of configSteps) {
      let element;

      if (step.tool === 'point') {
        element = this.getOrAssumePoint(step.data);
      }

      if (step.tool === 'segment') {
        let start: Point;
        let end: Point;

        if (step.data.angle !== undefined && step.depends?.length) {
          const protractorIndex = this.completedStepMap.get(step.depends[0]);
          if (protractorIndex !== undefined) {
            const protractor = this.construction.getGeoElementByIndex(
              protractorIndex
            ) as Protractor;

            start = protractor.center;
            const base = protractor.protractorAxis.end;

            const operator = step.data.operator ?? '=';
            const builder =
              this.angleConstructorMap[operator] ?? this.angleConstructorMap['='];
            const constructedAngle = builder(step.data.angle);

            end = this.constructPointAtAngle(
              start,
              base,
              constructedAngle,
              step.data.length ?? this.defaultlength,
              step.data.end.label
            );
            this.labelMap.set(step.data.end.label, end);
          } else {
            throw new Error(
              'Protractor dependency not found for angle-based segment'
            );
          }
        } else {
          start = this.getOrAssumePoint(step.data.start);

          // Always use constructPointAtAngle for normal segments
          const base = new Point(start.x + 1, start.y); // horizontal reference
          const angle = step.data.angle ?? 0;
          const length = step.data.length ?? this.defaultlength;

          end = this.constructPointAtAngle(
            start,
            base,
            angle,
            length,
            step.data.end.label
          );

          this.labelMap.set(step.data.end.label, end);
        }

        element = new LineSegment(start, end);
      }

      if (step.tool === 'protractor') {
        const center = this.getOrAssumePoint({ label: step.data.vertex });
        let axis: LineSegment;

        if (step.data.base) {
          const p1 =
            this.labelMap.get(step.data.base[0]) ??
            this.assumeCoordinate(step.data.base[0]);
          const p2 =
            this.labelMap.get(step.data.base[1]) ??
            this.assumeCoordinate(step.data.base[1]);
          axis = new LineSegment(p1, p2);
        } else {
          axis = new LineSegment(center, new Point(center.x + 1, center.y));
        }

        element = new Protractor(center, axis);
      }

      if (element) {
        this.construction.addGeoElement(element);
        this.completedStepMap.set(step.id, this.construction.getLength());
      }
    }
  }

  private constructPointAtAngle(
    from: Point,
    base: Point,
    angleDeg: number,
    length: number,
    label: string
  ): Point {
    const dx = base.x - from.x;
    const dy = base.y - from.y;
    const angleRad = (angleDeg * Math.PI) / 180;

    const rotatedDx = Math.cos(angleRad) * dx - Math.sin(angleRad) * dy;
    const rotatedDy = Math.sin(angleRad) * dx + Math.cos(angleRad) * dy;

    const mag = Math.hypot(rotatedDx, rotatedDy) || 1;
    const unitDx = rotatedDx / mag;
    const unitDy = rotatedDy / mag;

    const x = from.x + unitDx * length;
    const y = from.y + unitDy * length;

    return this.clampToVisible(new Point(x, y, label));
  }

  private computeBoundingBox(steps: any[]): {
    horizontalShift: number;
    verticalShift: number;
  } {
    let maxRight = 0,
      maxLeft = 0,
      maxUp = 0,
      maxDown = 0;
    const defaultLength = 4;

    for (const step of steps) {
      if (step.tool === 'segment' && step.data.length) {
        const length = step.data.length ?? defaultLength;
        const angleDeg = step.data.angle ?? 0;
        const angleRad = (angleDeg * Math.PI) / 180;

        const dx = Math.cos(angleRad) * length;
        const dy = Math.sin(angleRad) * length;

        if (dx > 0) maxRight = Math.max(maxRight, dx);
        else maxLeft = Math.max(maxLeft, Math.abs(dx));

        if (dy > 0) maxUp = Math.max(maxUp, dy);
        else maxDown = Math.max(maxDown, Math.abs(dy));
      }
    }

    return {
      horizontalShift: (maxLeft - maxRight) / 2,
      verticalShift: (maxDown - maxUp) / 2,
    };
  }

  private findFirstPointLabel(steps: any[]): string | null {
    for (const step of steps) {
      if (step.tool === 'point' && step.data.label) return step.data.label;
      if (step.tool === 'segment' && step.data.start?.label)
        return step.data.start.label;
    }
    return null;
  }

  private getOrAssumePoint(
    def: any,
    from?: Point,
    length?: number,
    angleDeg?: number
  ): Point {
    if (def.coordinate) {
      const p = new Point(def.coordinate[0], def.coordinate[1], def.label);
      this.labelMap.set(def.label, p);
      return p;
    }
    if (this.labelMap.has(def.label)) {
      return this.labelMap.get(def.label)!;
    }
    if (from && length !== undefined) {
      const base = new Point(from.x + 1, from.y);
      const p = this.constructPointAtAngle(
        from,
        base,
        angleDeg ?? 0,
        length,
        def.label
      );
      this.labelMap.set(def.label, p);
      return p;
    }
    return this.assumeCoordinate(def.label);
  }

  private assumeCoordinate(label: string): Point {
    const { centerX, centerY } = this.viewState.getVisibleWorldCenter();
    const offset = this.labelMap.size * 2;
    const assumed = this.clampToVisible(
      new Point(centerX + offset, centerY, label)
    );
    this.labelMap.set(label, assumed);
    return assumed;
  }

  private clampToVisible(p: Point): Point {
    const margin = 0.5;
    const { minX, maxX, minY, maxY } = this.viewState.getVisibleWorldRange();

    p.x = Math.max(minX + margin, Math.min(maxX - margin, p.x));
    p.y = Math.max(minY + margin, Math.min(maxY - margin, p.y));
    return p;
  }
}
