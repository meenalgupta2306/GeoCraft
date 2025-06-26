import { Injectable } from '@angular/core';
import { Tool } from './tools-interface';
import { Point } from '../../model/point';
import { ConstructionService } from '../construction.service';
import { ViewStateService } from '../../view/services/view-state.service';
import { LineSegment } from '../../model/segment';
import { GeoCraftViewComponent } from '../../view/geo-craft-view/geo-craft-view.component';
import { DrawSegment } from '../../drawable/draw-segment';
import { DrawPoint } from '../../drawable/draw-point';

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
    private viewStateService: ViewStateService
  ) {}

  //   handleClick(view: GeoCraftViewComponent, x: number, y: number): void {
  //   const point = new Point(x, y);

  //   if (!this.startPoint) {
  //     this.startPoint = point;

  //     // ⬇️ Show glowing point preview
  //     const dp = new DrawPoint(point);
  //     dp.setGlow(true);
  //     this.previewPoint = dp;

  //     this.viewStateService.addPreviewDrawable(dp);
  //   } else {
  //     const segment = new LineSegment(this.startPoint, point);
  //     this.constructionService.addGeoElement(segment);

  //     // ⬇️ Remove preview glow
  //     this.viewStateService.clearPreviewDrawables();

  //     // ⬇️ Add final (non-glowing) points and segment
  //     this.viewStateService.addDrawable(new DrawPoint(this.startPoint));
  //     this.viewStateService.addDrawable(new DrawPoint(point));
  //     this.viewStateService.addDrawable(new DrawSegment(segment));

  //     // Reset state
  //     this.startPoint = null;
  //     this.previewPoint = null;
  //   }

  //   view.render();
  // }

  // Called when pen/finger lifts:
  handlePointerDown(view: GeoCraftViewComponent, x: number, y: number): void {
    const point = new Point(x, y);

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
}
