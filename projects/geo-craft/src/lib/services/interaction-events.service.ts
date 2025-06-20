import { Component, Injectable, Type } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CompassComponent } from '../components/tools/compass/compass.component';
import { ToolDefinition } from '../models/tool-definition';
import { PointComponent } from '../components/tools/point/point.component';

@Injectable({
  providedIn: 'root',
})
export class InteractionEventsService {
  readonly tools: ToolDefinition[] = [
    { id: 1, name: 'compass', label: 'Compass', component: CompassComponent },
    { id: 2, name: 'point', label: 'Point', component: PointComponent },
  ];

  private toolSubject = new BehaviorSubject<Type<any> | null>(null);
  activeTool$ = this.toolSubject.asObservable();

  constructor() {}

  setActiveTool(component: Type<any>) {
    this.toolSubject.next(component);
  }
}
