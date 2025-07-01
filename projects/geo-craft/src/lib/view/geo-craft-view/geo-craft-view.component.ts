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
import { StepEvaluatorService } from '../../controller/step-evaluator.service';
import { StepReplayService } from '../../controller/step-replay.service';
import {config} from "../../config/config.json";

@Component({
  selector: 'lib-geo-craft-view',
  templateUrl: './geo-craft-view.component.html',
  styleUrls: ['./geo-craft-view.component.scss'],
})
export class GeoCraftViewComponent implements AfterViewInit {
  @ViewChild('canvasContainer', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;

  constructor(
    public toolManager: ToolManagerService,
    private renderer: CanvasRendererService,
    public viewState: ViewStateService,
    private eventLog: EventLogService,
    private construction: ConstructionService,
    private stepEvaluator: StepEvaluatorService,
    private stepReplay: StepReplayService,
  ) {}

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.resizeCanvas();
    setTimeout(()=>{
      this.render();
      this.stepReplay.playAll(config.steps, this);
    },1000)
    
  }
  ngOnInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.renderer.setContext(this.ctx);

    // Resize canvas to match parent size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Update coordinate system with initial values
    this.viewState.updateCoordinateSystem(
      canvas.width / 2,
      canvas.height / 2,
      canvas.width,
      canvas.height
    );
    this.stepEvaluator.loadConfig(config);
  }

  @HostListener('window:resize')
  resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    // 1️⃣ Match the canvas size to its displayed size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
        
    // 2️⃣ Update coordinate system and notify all components
    this.viewState.updateCoordinateSystem(
      canvas.width / 2,
      canvas.height / 2,
      canvas.width,
      canvas.height
    );

    // 3️⃣ Re-render everything at new size
    this.render();
  }

  toScreenX(xRW: number): number {
    return this.viewState.toScreenX(xRW);
  }

  toScreenY(yRW: number): number {
    return this.viewState.toScreenY(yRW);
  }

  toWorldX(screenX: number): number {
    return this.viewState.toWorldX(screenX);
  }

  toWorldY(screenY: number): number {
    return this.viewState.toWorldY(screenY);
  }
  getWorldCoordinates(event: MouseEvent | PointerEvent): { wx: number, wy: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const sx = (event.clientX - rect.left) * scaleX;
    const sy = (event.clientY - rect.top) * scaleY;

    const wx = this.toWorldX(sx);
    const wy = this.toWorldY(sy);

    return { wx, wy };
  }
  @HostListener('pointerdown', ['$event'])
    onPointerDown(event: PointerEvent) {
      const { wx, wy } = this.getWorldCoordinates(event);
      this.toolManager.handlePointerDown(this, wx, wy);
    }

    @HostListener('pointerup', ['$event'])
    onPointerUp(event: PointerEvent) {
      debugger
      const { wx, wy } = this.getWorldCoordinates(event);
      debugger
      this.toolManager.handlePointerUp(this, wx, wy);
       this.toolManager.validate();
    }


  // @HostListener('pointermove', ['$event'])
  // onPointerMove(event: PointerEvent) {
  //   const { wx, wy } = this.getWorldCoordinates(event);

  //   // 🔁 Send move to the current tool
  //   this.toolManager.handleMove?.(this, wx, wy);

  //   // 🔁 Re-render to show preview
  //   this.render();
  // }

  render() {
    const canvas = this.canvasRef.nativeElement;
    this.renderer.clear(canvas.width, canvas.height);

     // ✅ 1. Draw grid if enabled
    if (this.viewState.showGrid) {
      this.drawGrid(this.renderer);
    }
    this.viewState.getDrawables().forEach((d) => {
      d.render(this.renderer, this);
    });
    // Draw preview (temporary) items
    this.viewState.getPreviewDrawables().forEach(d => d.render(this.renderer, this));
    
     console.log('Event Log:', this.eventLog.getEvents());
    console.log('Construction Elements:', this.construction.getGeoElements());
  }

  drawGrid(renderer: CanvasRendererService) {
  const { minX, maxX, minY, maxY } = this.viewState.getVisibleWorldRange();
  const step = this.viewState.gridStep;
  const subStep = step / 5;

  const startX = Math.floor(minX / subStep) * subStep;
  const endX = Math.ceil(maxX / subStep) * subStep;
  const startY = Math.floor(minY / subStep) * subStep;
  const endY = Math.ceil(maxY / subStep) * subStep;

  // 1️⃣ Subgrid
  renderer.setStrokeStyle('#eeeeee');
  renderer.setLineWidth(0.5);
  for (let x = startX; x <= endX; x += subStep) {
    const sx = this.toScreenX(x);
    renderer.drawLine(sx, this.toScreenY(minY), sx, this.toScreenY(maxY));
  }
  for (let y = startY; y <= endY; y += subStep) {
    const sy = this.toScreenY(y);
    renderer.drawLine(this.toScreenX(minX), sy, this.toScreenX(maxX), sy);
  }

  // 2️⃣ Main grid
  renderer.setStrokeStyle('#dddddd');
  renderer.setLineWidth(1.2);
  for (let x = startX; x <= endX; x += step) {
    const sx = this.toScreenX(x);
    renderer.drawLine(sx, this.toScreenY(minY), sx, this.toScreenY(maxY));
  }
  for (let y = startY; y <= endY; y += step) {
    const sy = this.toScreenY(y);
    renderer.drawLine(this.toScreenX(minX), sy, this.toScreenX(maxX), sy);
  }

  // 3️⃣ Axes
  renderer.setStrokeStyle('#000');
  renderer.setLineWidth(1.5);
  renderer.drawLine(this.toScreenX(0), this.toScreenY(minY), this.toScreenX(0), this.toScreenY(maxY)); // Y axis
  renderer.drawLine(this.toScreenX(minX), this.toScreenY(0), this.toScreenX(maxX), this.toScreenY(0)); // X axis

  // 4️⃣ Labels
  renderer.setFillStyle('#000');
  renderer.setFont('12px sans-serif');

  for (let x = Math.ceil(minX); x <= Math.floor(maxX); x += step) {
    const sx = this.toScreenX(x);
    const sy = this.toScreenY(0);
    renderer.drawText(x.toString(), sx + 2, sy + 12);
  }

  for (let y = Math.ceil(minY); y <= Math.floor(maxY); y += step) {
    if (Math.abs(y) < 1e-6) continue; // Skip origin
    const sx = this.toScreenX(0);
    const sy = this.toScreenY(y);
    renderer.drawText(y.toString(), sx + 4, sy - 4);
  }
}




}
