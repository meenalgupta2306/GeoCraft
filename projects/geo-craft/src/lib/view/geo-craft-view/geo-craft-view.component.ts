import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
  AfterViewInit,
  SimpleChanges,
  Input,
} from '@angular/core';
import { CanvasRendererService } from '../services/canvas-renderer.service';
import { ToolManagerService } from '../../controller/tool-manager.service';
import { ViewStateService } from '../services/view-state.service';
import { EventLogService } from '../../controller/event-log.service';
import { ConstructionService } from '../../controller/construction.service';
import { StepReplayService } from '../../controller/step-replay.service';
import { ValidationService } from '../../controller/validation.service';
import { config } from '../../config/config.json';

@Component({
  selector: 'lib-geo-craft-view',
  templateUrl: './geo-craft-view.component.html',
  styleUrls: ['./geo-craft-view.component.scss'],
})
export class GeoCraftViewComponent implements AfterViewInit {
  @ViewChild('canvasContainer', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;
  private canvas!: HTMLCanvasElement;

  private ctx!: CanvasRenderingContext2D;

  @Input() currentQuestionCount!: number;

  constructor(
    public toolManager: ToolManagerService,
    private renderer: CanvasRendererService,
    public viewState: ViewStateService,
    private eventLog: EventLogService,
    private construction: ConstructionService,
    private validatiomService: ValidationService,
    private stepReplay: StepReplayService
  ) {}
  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentQuestionCount']?.currentValue) {
      this.renderer.clear(this.canvas.width, this.canvas.height);
      this.drawGrid(this.renderer, this.viewState.showGrid);
    }
  }

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.resizeCanvas();
    // setTimeout(()=>{
    //   this.stepReplay.playAll(config.steps, this);
    // },1000)
  }
  ngOnInit(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.renderer.setContext(this.ctx);

    // Resize this.canvas to match parent size
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;

    // Update coordinate system with initial values
    this.viewState.updateCoordinateSystem(
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.canvas.width,
      this.canvas.height
    );
    this.validatiomService.loadConfig(config[this.currentQuestionCount]);
  }

  @HostListener('window:resize')
  resizeCanvas() {
    // 1️⃣ Match the this.canvas size to its displayed size
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    // 2️⃣ Update coordinate system and notify all components
    this.viewState.updateCoordinateSystem(
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.canvas.width,
      this.canvas.height
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
  getWorldCoordinates(event: MouseEvent | PointerEvent): {
    wx: number;
    wy: number;
  } {
    const rect = this.canvas.getBoundingClientRect();

    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

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
    this.toolManager.handlePointerUp(this, wx, wy);
    // this.toolManager.validate();
    this.validatiomService.startValidation();
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
    this.renderer.clear(this.canvas.width, this.canvas.height);

    //Draw grid if enabled
    this.drawGrid(this.renderer, this.viewState.showGrid);
    this.viewState.getDrawables().forEach((d) => {
      d.render(this.renderer, this);
    });
    // Draw preview (temporary) items
    this.viewState
      .getPreviewDrawables()
      .forEach((d) => d.render(this.renderer, this));

    console.log('Event Log:', this.eventLog.getEvents());
    console.log('Construction Elements:', this.construction.getGeoElements());
  }

  drawGrid(renderer: CanvasRendererService, visible: boolean) {
    if (!visible) return;
    const { minX, maxX, minY, maxY } = this.viewState.getVisibleWorldRange();
    const step = this.viewState.gridStep;
    const subStep = step / 5;

    // Helper function to draw grid lines
    const drawGridLines = (
      start: number,
      end: number,
      increment: number,
      strokeStyle: string,
      lineWidth: number
    ) => {
      renderer.setStrokeStyle(strokeStyle);
      renderer.setLineWidth(lineWidth);

      // Vertical lines
      for (let x = start; x <= end; x += increment) {
        const sx = this.toScreenX(x);
        renderer.drawLine(sx, this.toScreenY(minY), sx, this.toScreenY(maxY));
      }

      // Horizontal lines
      for (let y = start; y <= end; y += increment) {
        const sy = this.toScreenY(y);
        renderer.drawLine(this.toScreenX(minX), sy, this.toScreenX(maxX), sy);
      }
    };

    // Calculate boundaries once
    const subBounds = {
      start: Math.floor(Math.min(minX, minY) / subStep) * subStep,
      end: Math.ceil(Math.max(maxX, maxY) / subStep) * subStep,
    };

    const mainBounds = {
      start: Math.floor(Math.min(minX, minY) / step) * step,
      end: Math.ceil(Math.max(maxX, maxY) / step) * step,
    };

    // 1️⃣ Subgrid
    drawGridLines(subBounds.start, subBounds.end, subStep, '#eeeeee', 0.5);

    // 2️⃣ Main grid
    drawGridLines(mainBounds.start, mainBounds.end, step, '#dddddd', 1.2);

    // 3️⃣ Axes
    renderer.setStrokeStyle('#000');
    renderer.setLineWidth(1.5);
    renderer.drawLine(
      this.toScreenX(0),
      this.toScreenY(minY),
      this.toScreenX(0),
      this.toScreenY(maxY)
    ); // Y axis
    renderer.drawLine(
      this.toScreenX(minX),
      this.toScreenY(0),
      this.toScreenX(maxX),
      this.toScreenY(0)
    ); // X axis

    // 4️⃣ Labels
    renderer.setFillStyle('#000');
    renderer.setFont('12px sans-serif');

    // X-axis labels (skip y=0 to avoid overlap with origin)
    for (let x = mainBounds.start; x <= mainBounds.end; x += step) {
      if (x >= minX && x <= maxX && Math.abs(x) > 1e-6) {
        renderer.drawText(
          x.toString(),
          this.toScreenX(x) + 2,
          this.toScreenY(0) + 12
        );
      }
    }

    // Y-axis labels (skip x=0 to avoid overlap with origin)
    for (let y = mainBounds.start; y <= mainBounds.end; y += step) {
      if (y >= minY && y <= maxY && Math.abs(y) > 1e-6) {
        renderer.drawText(
          y.toString(),
          this.toScreenX(0) + 4,
          this.toScreenY(y) - 4
        );
      }
    }

    // Origin label
    renderer.drawText('0', this.toScreenX(0) + 2, this.toScreenY(0) + 12);
  }

  toggleGrid(event: any) {
    this.viewState.showGrid = !this.viewState.showGrid;
    this.render();
  }
}
