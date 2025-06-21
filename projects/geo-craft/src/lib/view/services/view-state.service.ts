import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ViewStateService {
  canvasConfig: any;
  
    showGrid= true;
    snapToGrid= true;
    gridStep= 1;
  

  constructor() { }

  private drawables: any[] = [];

  addDrawable(drawable: any) {
    this.drawables.push(drawable);
  }

  getDrawables() {
    return this.drawables;
  }

  clear() {
    this.drawables = [];
  }

  setCanvasConfig(config: any) {
    this.canvasConfig = config;
  }

  getCanvasConfig() {
    return this.canvasConfig;
  }
}
