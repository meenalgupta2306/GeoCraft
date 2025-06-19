import { Component, Injectable, Type } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CompassComponent } from '../components/tools/compass/compass.component';
import { ToolDefinition } from '../models/tool-definition';

@Injectable({
  providedIn: 'root'
})
export class InteractionEventsService {
  readonly tools: ToolDefinition[] = [
  { id: 1, name: 'compass', label: 'Compass', component: CompassComponent }
];


  private toolSubject = new BehaviorSubject<Type<any> | null>(null);
  activeTool$ = this.toolSubject.asObservable();


  constructor() { }

  setActiveTool(component: Type<any>) {
    this.toolSubject.next(component);
  }
}
