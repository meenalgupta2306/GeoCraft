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

  private dragging = false;
  private startX = 0;
  private startY = 0;
  private currentPointerId: number | null = null;

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

  private onPointerDown = (event: PointerEvent) => {
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

    this.dragging = true;
    this.currentPointerId = event.pointerId;
    this.startX = event.clientX - this.offsetX;
    this.startY = event.clientY - this.offsetY;

    svg.setPointerCapture(event.pointerId);
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.dragging || event.pointerId !== this.currentPointerId) return;

    this.offsetX = event.clientX - this.startX;
    this.offsetY = event.clientY - this.startY;

    requestAnimationFrame(() => this.cdr.detectChanges());
  };

  private onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== this.currentPointerId) return;

    this.dragging = false;
    this.currentPointerId = null;

    const svg = this.svgRef.nativeElement;
    svg.releasePointerCapture(event.pointerId);
  };

  isPointInProtractor(x: number, y: number): boolean {

    const dx = x - this.centerX;
    const dy = y - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= this.radius && dy <= 0;
  }
}
