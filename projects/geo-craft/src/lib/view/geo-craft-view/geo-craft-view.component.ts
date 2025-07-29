import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
  AfterViewInit,
  SimpleChanges,
  Input,
  ChangeDetectorRef,
} from '@angular/core';
import { CanvasRendererService } from '../services/canvas-renderer.service';
import { ToolManagerService } from '../../controller/tool-manager.service';
import { ViewStateService } from '../services/view-state.service';
import { ValidationService } from '../../controller/validation.service';
import { config } from '../../config/config.json';
import { PointToolService } from '../../controller/tools/point-tool.service';
import { ProtractorToolService } from '../../controller/tools/protractor-tool.service';
import { SegmentToolService } from '../../controller/tools/segment-tool.service';
import { ConstructionService } from '../../controller/construction.service';
import { EventLogService } from '../../controller/event-log.service';
import { GeoRef } from '../../controller/interfaces/geoRef';
import { StepReplayService } from '../../controller/step-replay.service';
import { ConfigMapperService } from '../../controller/config-mapper.service';

@Component({
  selector: 'lib-geo-craft-view',
  templateUrl: './geo-craft-view.component.html',
  styleUrls: ['./geo-craft-view.component.scss'],
})
export class GeoCraftViewComponent implements AfterViewInit, GeoRef {
  @ViewChild('canvasContainer', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;
  private canvas!: HTMLCanvasElement;

  private ctx!: CanvasRenderingContext2D;

  notificationMessage: string | null = null;

  @Input() currentQuestionCount!: number;
  @Input() resetCanvas: boolean = false;

  constructor(
    public toolManager: ToolManagerService,
    private renderer: CanvasRendererService,
    public viewState: ViewStateService,
    private validationService: ValidationService,
    private pointToolService: PointToolService,
    private protractorToolService: ProtractorToolService,
    private segmentToolService: SegmentToolService,
    private constructionService: ConstructionService,
    private stepReplay: StepReplayService,
    private eventLogService: EventLogService,
    private cdr: ChangeDetectorRef,
    private configMapper: ConfigMapperService
  ) {}
  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['currentQuestionCount']?.currentValue !== undefined ||
      changes['resetCanvas']?.currentValue === true
    ) {
      // this.resetView();
      debugger
      // this.stepReplay.playAll(config[this.currentQuestionCount].steps, this);
      this.configMapper.placeFigureCentered(config[this.currentQuestionCount].steps);
      this.stepReplay.replayAll(this);
    }
  }

  resetView() {
    this.renderer.clear(this.canvas.width, this.canvas.height);
    this.viewState.clear();
    this.viewState.clearPreviewDrawables();
    this.pointToolService.reset();
    this.protractorToolService.protractorNeedsReset = true;
    this.segmentToolService.reset();
    this.toolManager.resetTools();
    this.constructionService.clear();
    this.validationService.reset();
    this.eventLogService.clear();
    this.render();
  }

  showNotification(message: string) {
    this.notificationMessage = message;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.notificationMessage = null; // <-- use null instead of ''
      this.cdr.detectChanges(); // make sure it re-evaluates *ngIf
    }, 2000);
  }

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.resizeCanvas();
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
    this.validationService.loadConfig(config[this.currentQuestionCount]);
    // this.stepReplay.playAll(config[this.currentQuestionCount].steps, this);
    this.configMapper.placeFigureCentered(config[this.currentQuestionCount].steps)
    console.log(this.constructionService.getGeoElements());
    this.stepReplay.replayAll(this);

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
    const { wx, wy } = this.getWorldCoordinates(event);
    //Check if point is in any blocked tool (like protractor)

    this.toolManager.handlePointerUp(this, wx, wy);

    // const activeToolName = this.toolManager.activeToolName;
    // const isRendered = activeToolName
    //   ? this.toolManager.isToolRendered(activeToolName)
    //   : false;

    // if (!isRendered) {
    //   this.validationService.startValidation();
    // }
  }

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
      strokeColor: string,
      lineWidth: number
    ) => {
      // renderer.setStrokeStyle(strokeStyle);
      renderer.setLineWidth(lineWidth);

      // Vertical lines
      for (let x = start; x <= end; x += increment) {
        const sx = this.toScreenX(x);
        renderer.drawLine(sx, this.toScreenY(minY), sx, this.toScreenY(maxY), strokeColor);
      }

      // Horizontal lines
      for (let y = start; y <= end; y += increment) {
        const sy = this.toScreenY(y);
        renderer.drawLine(this.toScreenX(minX), sy, this.toScreenX(maxX), sy, strokeColor);
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
    drawGridLines(subBounds.start, subBounds.end, subStep, 'rgba(40, 40, 40, 0.1)', 0.5);

    // 2️⃣ Main grid
    drawGridLines(mainBounds.start, mainBounds.end, step, 'rgba(0, 0, 0, 0.2)', 1.2);

    // 3️⃣ Axes
    // renderer.setStrokeStyle('rgba(255, 7, 7, 0.1)');
    // renderer.setLineWidth(1.5);
    renderer.drawLine(
      this.toScreenX(0),
      this.toScreenY(minY),
      this.toScreenX(0),
      this.toScreenY(maxY),
     'rgba(0, 0, 0, 0.60)'
    ); // Y axis
    renderer.drawLine(
      this.toScreenX(minX),
      this.toScreenY(0),
      this.toScreenX(maxX),
      this.toScreenY(0),
      'rgba(0, 0, 0, 0.60)'
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
