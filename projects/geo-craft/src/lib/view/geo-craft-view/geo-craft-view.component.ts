import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
  AfterViewInit,
} from '@angular/core';
import { CanvasRendererService } from '../services/canvas-renderer.service';
import { ToolManagerService } from '../../controller/tool-manager.service';
import { ViewStateService } from '../services/view-state.service';
import { EventLogService } from '../../controller/event-log.service';
import { ConstructionService } from '../../controller/construction.service';

@Component({
  selector: 'lib-geo-craft-view',
  templateUrl: './geo-craft-view.component.html',
  styleUrls: ['./geo-craft-view.component.scss'],
})
export class GeoCraftViewComponent implements AfterViewInit {
  @ViewChild('canvasContainer', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;

  xZero = 400;
  yZero = 300;
  xScale = 100;
  yScale = 100;

  constructor(
    private toolManager: ToolManagerService,
    private renderer: CanvasRendererService,
    private viewState: ViewStateService,
    private eventLog: EventLogService,
    private construction: ConstructionService
  ) {}

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.resizeCanvas();
    this.render();
  }
  ngOnInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.renderer.setContext(this.ctx);

    // Resize canvas to match parent size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  @HostListener('window:resize')
  resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    // 1️⃣ Match the canvas size to its displayed size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // 2️⃣ Re-render everything at new size
    this.render();
  }

  toScreenX(xRW: number): number {
    return Math.round(this.xZero + xRW * this.xScale);
  }
  toScreenY(yRW: number): number {
    return Math.round(this.yZero - yRW * this.yScale);
  }

  toWorldX(screenX: number): number {
    return (screenX - this.xZero) / this.xScale;
  }

  toWorldY(screenY: number): number {
    return (this.yZero - screenY) / this.yScale;
  }

  @HostListener('click', ['$event'])
  onCanvasClick(event: MouseEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    // 3️⃣ Compute scaling factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // 4️⃣ Map screen to canvas pixel coordinates
    const sx = (event.clientX - rect.left) * scaleX;
    const sy = (event.clientY - rect.top) * scaleY;

    // 5️⃣ Convert to world if needed
    const wx = this.toWorldX(sx);
    const wy = this.toWorldY(sy);

    this.toolManager.handleClick(this, wx, wy);
    this.render();
  }

  render() {
    const canvas = this.canvasRef.nativeElement;
    this.renderer.clear(canvas.width, canvas.height);

    debugger;
     // ✅ 1. Draw grid if enabled
    if (this.viewState.showGrid) {
      this.drawGrid(this.renderer);
    }
    this.viewState.getDrawables().forEach((d) => {
      d.render(this.renderer, this);
    });
     console.log('Event Log:', this.eventLog.getEvents());
    console.log('Construction Elements:', this.construction.getGeoElements());
  }

drawGrid(renderer: CanvasRendererService) {
  const step = this.viewState.gridStep;
  const subStep = step / 5;
  const range = 10;

  // 1️⃣ Subgrid
  renderer.setStrokeStyle('#D3D3D3');
  renderer.setLineWidth(0.5);
  for (let x = -range; x <= range; x += subStep) {
    const sx = this.toScreenX(x);
    renderer.drawLine(sx, this.toScreenY(-range), sx, this.toScreenY(range));
  }
  for (let y = -range; y <= range; y += subStep) {
    const sy = this.toScreenY(y);
    renderer.drawLine(this.toScreenX(-range), sy, this.toScreenX(range), sy);
  }

  // 2️⃣ Main grid
  renderer.setStrokeStyle('#ccc');
  renderer.setLineWidth(1.5);
  for (let x = -range; x <= range; x += step) {
    const sx = this.toScreenX(x);
    renderer.drawLine(sx, this.toScreenY(-range), sx, this.toScreenY(range));
  }
  for (let y = -range; y <= range; y += step) {
    const sy = this.toScreenY(y);
    renderer.drawLine(this.toScreenX(-range), sy, this.toScreenX(range), sy);
  }

  // 3️⃣ Axes
  renderer.setStrokeStyle('#000');
  renderer.setLineWidth(2);
  renderer.drawLine(this.toScreenX(0), this.toScreenY(-range), this.toScreenX(0), this.toScreenY(range)); // Y axis
  renderer.drawLine(this.toScreenX(-range), this.toScreenY(0), this.toScreenX(range), this.toScreenY(0)); // X axis

  // 4️⃣ Labels
  renderer.setFillStyle('#000');
  renderer.setFont('12px sans-serif');
  for (let x = -range; x <= range; x += step) {
    const sx = this.toScreenX(x);
    renderer.drawText(x.toString(), sx + 2, this.toScreenY(0) + 12);
  }
  for (let y = -range; y <= range; y += step) {
    if (y === 0) continue; // skip origin
    const sy = this.toScreenY(y);
    renderer.drawText(y.toString(), this.toScreenX(0) + 2, sy - 2);
  }
}


}
