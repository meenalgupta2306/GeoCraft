import { Injectable } from '@angular/core';
import { Tool } from './tools-interface';
import { Point } from '../../model/point';
import { ConstructionService } from '../construction.service';
import { ViewStateService } from '../../view/services/view-state.service';
import { LineSegment } from '../../model/segment';
import { GeoCraftViewComponent } from '../../view/geo-craft-view/geo-craft-view.component';
import { DrawSegment } from '../../drawable/draw-segment';

@Injectable({
  providedIn: 'root'
})
export class SegmentToolService implements Tool{

   private startPoint: Point | null = null;

  constructor(
    private constructionService: ConstructionService,
    private viewStateService: ViewStateService
  ) {}

  handleClick(view: GeoCraftViewComponent, x: number, y: number): void {
  const point = new Point(x, y);

  if (!this.startPoint) {
    this.startPoint = point;

    this.viewStateService.setPreviewDrawables([
      new DrawSegment(new LineSegment(this.startPoint, this.startPoint), true)
    ]);
  } else {
    const segment = new LineSegment(this.startPoint, point);
    this.constructionService.addGeoElement(segment);

    this.viewStateService.addDrawable(new DrawSegment(segment)); // just segment

    this.viewStateService.clearPreviewDrawables();
    this.startPoint = null;
  }

  view.render();
}

handleMove(view: GeoCraftViewComponent, x: number, y: number): void {
  if (this.startPoint) {
    const endPoint = new Point(x, y);
    this.viewStateService.setPreviewDrawables([
      new DrawSegment(new LineSegment(this.startPoint, endPoint), true)
    ]);
    view.render();
  }
}


cancel(): void {
  this.startPoint = null;
  this.viewStateService.clearPreviewDrawables();
}


}
