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
declare let fabric: any;
import { FabricRendererService } from '../services/fabric-renderer.service';
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

@Component({
  selector: 'lib-geo-craft-view',
  templateUrl: './geo-craft-view.component.html',
  styleUrls: ['./geo-craft-view.component.scss'],
})
export class GeoCraftViewComponent implements AfterViewInit, OnInit {
  @ViewChild('canvasContainer', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;
  private canvas!: HTMLCanvasElement;

  fabricCanvas = new fabric.Canvas();
  private gridDrawn = false;

  notificationMessage: string | null = null;

  @Input() currentQuestionCount!: number;
  @Input() resetCanvas: boolean = false;

  constructor(
    public toolManager: ToolManagerService,
    private renderer: FabricRendererService,
    public viewState: ViewStateService,
    private validationService: ValidationService,
    private pointToolService: PointToolService,
    private protractorToolService: ProtractorToolService,
    private segmentToolService: SegmentToolService,
    private constructionService: ConstructionService,
    private eventLogService: EventLogService,
    private cdr: ChangeDetectorRef
  ) {}
  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['currentQuestionCount']?.currentValue !== undefined ||
      changes['resetCanvas']?.currentValue === true
    ) {
      this.resetView();
    }
  }

  resetView() {
    this.renderer.clear();
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
      this.notificationMessage = null;
      this.cdr.detectChanges();
    }, 2000);
  }

  ngAfterViewInit() {
    this.fabricCanvas = new fabric.Canvas(this.canvasRef.nativeElement, {
      selection: false,
      preserveObjectStacking: true,
    });

    this.renderer.setCanvas(this.fabricCanvas);
    this.resizeCanvas();
  }
  ngOnInit(): void {
    this.canvas = this.canvasRef.nativeElement;
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
    this.viewState.lastElement.subscribe((lastElement: any) => {
      lastElement.lastElement.updateStroke(
        this.renderer,
        this,
        lastElement.type
      );
    });
  }

  @HostListener('window:resize')
  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    this.viewState.updateCoordinateSystem(
      rect.width / 2,
      rect.height / 2,
      rect.width,
      rect.height
    );

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
    this.toolManager.handlePointerUp(this, wx, wy);
  }

  render(fullRender: boolean = false) {
    this.drawGrid(this.renderer, true);
    this.gridDrawn = true;
    this.viewState.getDrawables().forEach((d) => {
      d.render(this.renderer, this);
    });

    this.viewState.getPreviewDrawables().forEach((d) => {
      d.render(this.renderer, this);
    });
  }

  undo() {
    const removedElements = this.viewState.undo();

    if (!removedElements) return;
    const toRemove = Array.isArray(removedElements)
      ? removedElements
      : [removedElements];
    toRemove.forEach((element) => {
      if (element.point) this.pointToolService.undoLebel();
      element.dispose(this.renderer);
    });
  }

  drawGrid(renderer: FabricRendererService, visible: boolean) {
    if (!visible) return;
    const { minX, maxX, minY, maxY } = this.viewState.getVisibleWorldRange();
    const step = this.viewState.gridStep;
    const subStep = step / 5;

    const drawLines = (
      start: number,
      end: number,
      increment: number,
      color: string,
      width: number
    ) => {
      for (let x = start; x <= end; x += increment) {
        const sx = this.toScreenX(x);
        renderer.drawLine(
          sx,
          this.toScreenY(minY),
          sx,
          this.toScreenY(maxY),
          color,
          width
        );
      }

      for (let y = start; y <= end; y += increment) {
        const sy = this.toScreenY(y);
        renderer.drawLine(
          this.toScreenX(minX),
          sy,
          this.toScreenX(maxX),
          sy,
          color,
          width
        );
      }
    };

    const subBounds = {
      start: Math.floor(Math.min(minX, minY) / subStep) * subStep,
      end: Math.ceil(Math.max(maxX, maxY) / subStep) * subStep,
    };

    const mainBounds = {
      start: Math.floor(Math.min(minX, minY) / step) * step,
      end: Math.ceil(Math.max(maxX, maxY) / step) * step,
    };

    drawLines(subBounds.start, subBounds.end, subStep, '#eeeeee', 0.5);
    drawLines(mainBounds.start, mainBounds.end, step, '#dddddd', 1.2);

    // Axes
    renderer.drawLine(
      this.toScreenX(0),
      this.toScreenY(minY),
      this.toScreenX(0),
      this.toScreenY(maxY),
      '#000',
      1.5
    );
    renderer.drawLine(
      this.toScreenX(minX),
      this.toScreenY(0),
      this.toScreenX(maxX),
      this.toScreenY(0),
      '#000',
      1.5
    );

    // Labels
    for (let x = mainBounds.start; x <= mainBounds.end; x += step) {
      if (x >= minX && x <= maxX && Math.abs(x) > 1e-6) {
        renderer.drawText(
          x.toString(),
          this.toScreenX(x) + 2,
          this.toScreenY(0) + 12
        );
      }
    }

    for (let y = mainBounds.start; y <= mainBounds.end; y += step) {
      if (y >= minY && y <= maxY && Math.abs(y) > 1e-6) {
        renderer.drawText(
          y.toString(),
          this.toScreenX(0) + 4,
          this.toScreenY(y) - 4
        );
      }
    }

    renderer.drawText('0', this.toScreenX(0) + 2, this.toScreenY(0) + 12);
  }

  toggleGrid(event: any) {
    this.viewState.showGrid = !this.viewState.showGrid;
    this.render();
  }
}
