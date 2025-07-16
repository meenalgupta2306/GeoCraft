import { Injectable, Injector } from '@angular/core';
import { PassiveTool } from '../interfaces/passiveTool-interface';
import { ValidationResult } from '../interfaces/validationResult-interface';
import { ViewStateService } from '../../view/services/view-state.service';
import { ValidationService } from '../validation.service';
import { Protractor } from '../../model/protractor';
import { ConstructionService } from '../construction.service';
import { LineSegment } from '../../model/segment';

export interface BlockingRegion {
  contains: (x: number, y: number) => boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProtractorToolService implements PassiveTool {
  private validationService!: ValidationService;
  private locked: boolean = false;
  private blockingRegions: BlockingRegion[] = [];
  public protractorNeedsReset = false;

  constructor(private viewState: ViewStateService, private injector: Injector) {
    setTimeout(() => {
      this.validationService = this.injector.get(ValidationService);
    });
  }

  validate(
    step: any,
    geoElement: Protractor,
    labelSensitive: boolean
  ): ValidationResult {
    let matched = false;
    let reason = '';
    let outputObject: LineSegment | undefined;

    if (!this.validationService) {
      reason = 'Something went wrong. Please try again.';
    } else if (!step?.id || !step?.data?.vertex) {
      reason = 'This step seems to be incomplete.';
    } else {
      const depends = step.depends || [];
      const protractorCenter = geoElement.center;
      const step1 = this.validationService.getGeoElementByStepId(depends[0]);

      outputObject = new LineSegment(step1.start, step1.end);

      let vertexPoint: any = null;
      let otherPoint: any = null;

      if (labelSensitive) {
        const vertex = step.data;
        vertexPoint = this.getPointByLabelFromStepElement(step1, vertex);
        if (!vertexPoint) {
          reason = `Couldn't find the point labeled "${vertex}".`;
        } else {
          const dx = protractorCenter.x - vertexPoint.x;
          const dy = protractorCenter.y - vertexPoint.y;
          const distance = Math.hypot(dx, dy);
          if (distance > this.viewState.toleranceFactor.protractorCenter) {
            reason = `ProtractorCenterError".`;
          } else {
            const { start, end } = step1;
            otherPoint = start?.label === vertex ? end : start;
          }
        }
      } else {
        const { start, end } = step1;
        const dStart = Math.hypot(
          protractorCenter.x - start.x,
          protractorCenter.y - start.y
        );
        const dEnd = Math.hypot(
          protractorCenter.x - end.x,
          protractorCenter.y - end.y
        );
        if (dStart <= this.viewState.toleranceFactor.protractorAlignment) {
          vertexPoint = start;
          otherPoint = end;
        } else if (dEnd <= this.viewState.toleranceFactor.protractorAlignment) {
          vertexPoint = end;
          otherPoint = start;
        } else {
          reason = `Place the center of the protractor on one of the ends of the segment.`;
        }
      }

      if (vertexPoint && otherPoint) {
        geoElement.addVertex(vertexPoint.label);
        const p1 = protractorCenter;
        const p2 = geoElement.protractorAxis.end;
        const p3 = otherPoint;
        const isCollinear = this.areCollinear(
          p1,
          p2,
          p3,
          this.viewState.toleranceFactor.protractorAlignment
        );

        if (!isCollinear) {
          reason = `ProtractorMisaligned`;
        } else {
          matched = true;
          // outputObject = new LineSegment(step1.start, step1.end);
        }
      }
    }

    // if (!matched && reason) {
    //   this.viewState.emitmessage(reason); // ✅ Single point for message
    // }

    return {
      matched,
      reason: matched
        ? ' Perfect alignment! You can proceed to draw the required angle.'
        : reason,
      data: {baseSegement: outputObject},
    };
  }

  areCollinear(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    epsilon = 1e-6
  ): boolean {
    const area = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    return Math.abs(area) < epsilon;
  }

  getPointByLabelFromStepElement(
    element: any,
    label: string
  ): { x: number; y: number; label: string } | null {
    if (!element || !element.tool) return null;

    switch (element.tool) {
      case 'segment': {
        const { start, end } = element;
        if (start?.label === label) return start;
        if (end?.label === label) return end;
        break;
      }
    }

    return null;
  }

  isLocked(): boolean {
    return this.locked;
  }

  lockProtractor() {
    this.locked = !this.locked;
    return this.locked;
  }

  resetLock() {
    this.locked = false;
    return this.locked;
  }

  registerBlockingRegion(region: BlockingRegion) {
    this.blockingRegions.push(region);
  }

  clearBlockingRegions() {
    this.blockingRegions = [];
  }

  isPointInBlockedArea(worldX: number, worldY: number): boolean {
    return this.blockingRegions.some((region) =>
      region.contains(worldX, worldY)
    );
  }
}
