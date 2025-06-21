import { Injectable } from '@angular/core';

export interface ConstructionEvent {
  tool: string;
  [key: string]: any;
}


@Injectable({
  providedIn: 'root'
})
export class EventLogService {

  constructor() { }
   private events: ConstructionEvent[] = [];

  record(event: ConstructionEvent) {
    this.events.push(event);
    console.log(this.events)
  }

  getEvents() {
    return this.events;
  }

  clear() {
    this.events = [];
  }
}
