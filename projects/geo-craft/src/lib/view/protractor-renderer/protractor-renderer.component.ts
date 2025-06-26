import {
  Component,
  OnInit,
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

  centerX;
  centerY;

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

  ngOnInit(): void {}
  ngAfterViewInit() {
    const svg = this.svgRef.nativeElement;

    this.ngZone.runOutsideAngular(() => {
      svg.addEventListener('pointerdown', this.onPointerDown);
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

  polar(angle: number, r: number): { x: number; y: number } {
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
  event.preventDefault();
  this.dragging = true;
  this.currentPointerId = event.pointerId;
  this.startX = event.clientX - this.offsetX;
  this.startY = event.clientY - this.offsetY;

  const svg = this.svgRef.nativeElement;
  svg.setPointerCapture(event.pointerId);

  svg.addEventListener('pointermove', this.onPointerMove);
  svg.addEventListener('pointerup', this.onPointerUp);
  svg.addEventListener('pointercancel', this.onPointerUp);
};

private onPointerMove = (event: PointerEvent) => {
  if (!this.dragging || event.pointerId !== this.currentPointerId) return;

  this.offsetX = event.clientX - this.startX;
  this.offsetY = event.clientY - this.startY;

  // Just trigger re-render of transform
  requestAnimationFrame(() => this.cdr.detectChanges());
};

private onPointerUp = (event: PointerEvent) => {
  event.stopPropagation();
  if (event.pointerId !== this.currentPointerId) return;

  this.dragging = false;
  this.currentPointerId = null;

  const svg = this.svgRef.nativeElement;
  svg.releasePointerCapture(event.pointerId);
  svg.removeEventListener('pointermove', this.onPointerMove);
  svg.removeEventListener('pointerup', this.onPointerUp);
  svg.removeEventListener('pointercancel', this.onPointerUp);
};
}
