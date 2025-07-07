import {
  Component,
  NgZone,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { ViewStateService } from '../services/view-state.service';
import { ValidationService } from '../../controller/validation.service';
import { ConstructionService } from '../../controller/construction.service';
import { ProtractorToolService } from '../../controller/tools/protractor-tool.service';
import { Point } from '../../model/point';
import { Protractor } from '../../model/protractor';
import { LineSegment } from '../../model/segment';

@Component({
  selector: 'lib-protractor-renderer',
  templateUrl: './protractor-renderer.component.html',
  styleUrls: ['./protractor-renderer.component.scss'],
})
export class ProtractorRendererComponent implements AfterViewInit {
  @ViewChild('svgRoot', { static: true }) svgRef!: ElementRef<SVGSVGElement>;

  radius: number = 250;
  centerX: number;
  centerY: number;

  offsetX = 0;
  offsetY = 0;
  rotation = 0;

  locked = false;

  private dragging = false;
  private rotating = false;
  private startX = 0;
  private startY = 0;
  private startAngle = 0;
  private currentPointerId: number | null = null;

  innerRadius = 150;
  private blockingRegionUpdateTimeout: any = null;

  constructor(
    public viewState: ViewStateService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private validationService: ValidationService,
    private constructionService: ConstructionService,
    private protractorToolService: ProtractorToolService
  ) {
    this.centerX = viewState.canvasWidth / 2;
    this.centerY = viewState.canvasHeight / 2;
  }

  ngAfterViewInit() {
    const svg = this.svgRef.nativeElement;

    this.ngZone.runOutsideAngular(() => {
      svg.addEventListener('pointerdown', this.onPointerDown);
      svg.addEventListener('pointermove', this.onPointerMove);
      svg.addEventListener('pointerup', this.onPointerUp);
      svg.addEventListener('pointercancel', this.onPointerUp);
      svg.addEventListener('click', this.onClick);
    });
  }

  get ticks() {
    const result = [];
    for (let angle = 0; angle <= 180; angle++) {
      let type = 'minor';
      if (angle % 10 === 0) type = 'major';
      else if (angle % 5 === 0) type = 'medium';
      result.push({ angle, type });
    }
    return result;
  }

  polar(angle: number, r: number) {
    const rad = (angle * Math.PI) / 180;
    return {
      x: this.centerX + r * Math.cos(rad),
      y: this.centerY - r * Math.sin(rad),
    };
  }

  labelAt(angle: number, r: number) {
    return this.polar(angle, r);
  }

  // Get the transform string including both translation and rotation
  get transformString(): string {
    return `translate(${this.offsetX}, ${this.offsetY}) rotate(${this.rotation}, ${this.centerX}, ${this.centerY})`;
  }

  private onPointerDown = (event: PointerEvent) => {
    if (!this.isEventInsideProtractor(event)) return;

    event.preventDefault();
    event.stopPropagation();
    if (this.locked) return;

    const svg = this.svgRef.nativeElement;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;

    const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());

    // Account for current offset before hit testing
    const localX = svgPt.x - this.offsetX;
    const localY = svgPt.y - this.offsetY;

    if (!this.isPointInProtractor(localX, localY)) return;

    this.currentPointerId = event.pointerId;

    // Determine if we're in the inner circle (for movement) or outer ring (for rotation)
    const distanceFromCenter = this.getDistanceFromCenter(localX, localY);

    if (distanceFromCenter <= this.innerRadius) {
      // Inner semicircle - enable movement
      this.dragging = true;
      this.rotating = false;
      this.startX = event.clientX - this.offsetX;
      this.startY = event.clientY - this.offsetY;
    } else {
      // Outer ring - enable rotation
      this.rotating = true;
      this.dragging = false;
      this.startAngle = this.getAngleFromCenter(localX, localY) - this.rotation;
    }

    svg.setPointerCapture(event.pointerId);
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.dragging && !this.rotating) return;
    if (event.pointerId !== this.currentPointerId) return;

    if (this.dragging) {
      // Handle movement
      this.offsetX = event.clientX - this.startX;
      this.offsetY = event.clientY - this.startY;
    } else if (this.rotating) {
      // Handle rotation
      const svg = this.svgRef.nativeElement;
      const pt = svg.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;

      const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
      const localX = svgPt.x - this.offsetX;
      const localY = svgPt.y - this.offsetY;

      const currentAngle = this.getAngleFromCenter(localX, localY);
      this.rotation = currentAngle - this.startAngle;

      this.rotation = ((this.rotation % 360) + 360) % 360;
    }
    requestAnimationFrame(() => this.cdr.detectChanges());
  };

  private onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== this.currentPointerId) return;

    this.dragging = false;
    this.rotating = false;
    this.currentPointerId = null;

    const svg = this.svgRef.nativeElement;
    svg.releasePointerCapture(event.pointerId);
  };

  // Helper method to get distance from protractor center
  private getDistanceFromCenter(x: number, y: number): number {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Helper method to get angle from protractor center
  private getAngleFromCenter(x: number, y: number): number {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    return ((angle % 360) + 360) % 360;
  }

  private onClick = (event: MouseEvent) => {
    if (!this.isEventInsideProtractor(event)) return;
    event.stopPropagation();
    event.preventDefault();

    const svg = this.svgRef.nativeElement;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;

    const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const localX = svgPt.x - this.offsetX;
    const localY = svgPt.y - this.offsetY;

    if (this.isPointInProtractor(localX, localY)) {
      this.locked = this.protractorToolService.lockProtractor();
      this.updateBlockingRegion();
      if (this.locked) {
        this.validateProtractorPlacement();
      }

      alert(`${this.locked ? 'locked' : 'unlocked'}`);
    }
  };

  isWorldPointInsideProtractor(worldX: number, worldY: number): boolean {
    const canvasX = this.viewState.toScreenX(worldX);
    const canvasY = this.viewState.toScreenY(worldY);

    return this.isPointInProtractor(canvasX, canvasY);
  }

  getProtractorReferenceAxisEndpoints() {
    const leftX = this.viewState.toWorldX(
      this.centerX +
        this.offsetX -
        this.radius * Math.cos((this.rotation * Math.PI) / 180)
    );
    const leftY = this.viewState.toWorldY(
      this.centerY +
        this.offsetY -
        this.radius * Math.sin((this.rotation * Math.PI) / 180)
    );
    const leftEndpoint = new Point(leftX, leftY);

    const rightX = this.viewState.toWorldX(
      this.centerX +
        this.offsetX +
        this.radius * Math.cos((this.rotation * Math.PI) / 180)
    );
    const rightY = this.viewState.toWorldY(
      this.centerY +
        this.offsetY +
        this.radius * Math.sin((this.rotation * Math.PI) / 180)
    );
    const rightEndpoint = new Point(rightX, rightY);

    return new LineSegment(leftEndpoint, rightEndpoint);
  }

  getProtractorCenter() {
    let x = this.viewState.toWorldX(this.centerX + this.offsetX);
    let y = this.viewState.toWorldY(this.centerY + this.offsetY);
    return new Point(x, y);
  }

  private validateProtractorPlacement() {
    // Insert the current geoElement into ConstructionService’s list
    const geoElement = this.getProtractorGeoElement();

    this.constructionService.addGeoElement(geoElement);

    // Now validate the new element with existing steps
    this.validationService.startValidation();
  }
  private getProtractorGeoElement() {
    const center = this.getProtractorCenter();
    const referenceAxis = this.getProtractorReferenceAxisEndpoints();

    return new Protractor(center, referenceAxis);
  }

  isPointInProtractorWithRotation(x: number, y: number): boolean {
    // Get the protractor center in canvas coordinates
    const protractorCenterX = this.centerX + this.offsetX;
    const protractorCenterY = this.centerY + this.offsetY;

    // Translate point to protractor's local coordinate system
    const dx = x - protractorCenterX;
    const dy = y - protractorCenterY;

    // Apply inverse rotation to get the point in protractor's original orientation
    const rotationRad = (-this.rotation * Math.PI) / 180;
    const rotatedX = dx * Math.cos(rotationRad) - dy * Math.sin(rotationRad);
    const rotatedY = dx * Math.sin(rotationRad) + dy * Math.cos(rotationRad);

    // Check if the rotated point is within the protractor bounds
    const distance = Math.sqrt(rotatedX * rotatedX + rotatedY * rotatedY);
    // Check if point is within radius and in the upper semicircle (dy <= 0 in local coords)
    return distance <= this.radius && rotatedY <= 0;
  }

  isPointInProtractor(x: number, y: number): boolean {
    // If rotation is 0, use the simpler method
    if (this.rotation === 0) {
      const dx = x - this.centerX;
      const dy = y - this.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= this.radius && dy <= 0;
    }

    // For rotated protractor, use the rotation-aware method
    const canvasX = x + this.offsetX;
    const canvasY = y + this.offsetY;
    return this.isPointInProtractorWithRotation(canvasX, canvasY);
  }

  updateBlockingRegion() {
    if (!this.locked) {
      return;
    }
    // Clear existing and register new
    this.protractorToolService.clearBlockingRegions();
    this.protractorToolService.registerBlockingRegion({
      contains: (worldX: number, worldY: number) =>
        this.isWorldPointInsideProtractor(worldX, worldY),
    });
  }

  scheduleBlockingRegionUpdate() {
    if (this.blockingRegionUpdateTimeout) {
      clearTimeout(this.blockingRegionUpdateTimeout);
    }

    this.blockingRegionUpdateTimeout = setTimeout(() => {
      this.updateBlockingRegion();
    }, 300);
  }

  private isEventInsideProtractor(event: PointerEvent | MouseEvent): boolean {
    const svg = this.svgRef.nativeElement;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;

    const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const localX = svgPt.x - this.offsetX;
    const localY = svgPt.y - this.offsetY;

    return this.isPointInProtractor(localX, localY);
  }
}
