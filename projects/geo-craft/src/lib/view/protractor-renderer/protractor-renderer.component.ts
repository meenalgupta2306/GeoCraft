import {
  Component,
  NgZone,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { ViewStateService } from '../services/view-state.service';

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

  innerRadius = 100;

  constructor(
    public viewState: ViewStateService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
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

    event.preventDefault();
    event.stopPropagation();

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
      console.log(`Start angle: ${this.startAngle} degrees`);
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
      console.log(`currentAngle : ${currentAngle} degrees`);
      this.rotation = currentAngle - this.startAngle;

      // Normalize rotation to 0-360 degrees
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
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI; // Removed the negative sign to fix rotation direction
    return ((angle % 360) + 360) % 360; // Normalize to 0-360
  }

  isPointInProtractor(x: number, y: number): boolean {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= this.radius && dy <= 0;
  }
  private onClick = (event: MouseEvent) => {
    const svg = this.svgRef.nativeElement;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;

    const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());

    const localX = svgPt.x - this.offsetX;
    const localY = svgPt.y - this.offsetY;

    if (this.isPointInProtractor(localX, localY)) {
      this.locked = !this.locked;
      alert(`${this.locked ? 'locked' : 'unlocked'}`);
      event.stopPropagation();
    }
  };
}
