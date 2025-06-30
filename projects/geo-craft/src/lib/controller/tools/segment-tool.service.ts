import { Injectable } from '@angular/core';
import { Tool } from './tools-interface';
import { Point } from '../../model/point';
import { ConstructionService } from '../construction.service';
import { ViewStateService } from '../../view/services/view-state.service';
import { LineSegment } from '../../model/segment';
import { GeoCraftViewComponent } from '../../view/geo-craft-view/geo-craft-view.component';
import { DrawSegment } from '../../drawable/draw-segment';
import { DrawPoint } from '../../drawable/draw-point';
import { PointToolService } from './point-tool.service';

@Injectable({
  providedIn: 'root',
})
export class SegmentToolService implements Tool {
  private startPoint: Point | null = null;
  private endPoint: Point | null = null;
  private segment: LineSegment | null = null;

  private previewStartPoint: DrawPoint | null = null;
  private previewEndPoint: DrawPoint | null = null;

  constructor(
    private constructionService: ConstructionService,
    private viewStateService: ViewStateService,
    private pointToolService: PointToolService
  ) {}

  handlePointerDown(view: GeoCraftViewComponent, x: number, y: number): void {
    const label = this.pointToolService.getNextLabel();
    const point = new Point(x, y, label);

    if (!this.startPoint) {
      // First point: start a segment
      this.startPoint = point;
      this.previewStartPoint = new DrawPoint(point);
      this.previewStartPoint.setGlow(true);
      this.viewStateService.addPreviewDrawable(this.previewStartPoint);
    } else {
      // Second point: store segment for confirmation on pointerup
      this.endPoint = point;
      this.previewEndPoint = new DrawPoint(point);
      this.previewEndPoint.setGlow(true);

      this.segment = new LineSegment(this.startPoint, this.endPoint);

      // Add preview segment only (not final yet)
      this.viewStateService.setPreviewDrawables([
        this.previewStartPoint!,
        new DrawSegment(this.segment, true),
        this.previewEndPoint,
      ]);
    }

    view.render();
  }

  handlePointerUp(view: GeoCraftViewComponent): void {
    // If only one point tapped, do nothing
    if (!this.segment || !this.previewEndPoint || !this.previewStartPoint)
      return;

    // Finalize segment
    this.constructionService.addGeoElement(this.segment);

    // Remove glow
    this.previewStartPoint.setGlow(false);
    this.previewEndPoint.setGlow(false);

    // Clear preview and add final drawables
    this.viewStateService.clearPreviewDrawables();

    [
      this.previewStartPoint,
      new DrawSegment(this.segment),
      this.previewEndPoint,
    ].forEach((item) => {
      this.viewStateService.addDrawable(item);
    });

    //reset
    this.startPoint = null;
    this.endPoint = null;
    this.segment = null;
    this.previewStartPoint = null;
    this.previewEndPoint = null;

    view.render();
  }

  cancel(): void {
    this.startPoint = null;
    this.viewStateService.clearPreviewDrawables();
  }

  validate(){
    return true;
  }
}
