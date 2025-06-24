import { Injectable } from '@angular/core';

import {Tool} from './tools/tools-interface';
import { PointToolService } from './tools/point-tool.service';

@Injectable({
  providedIn: 'root'
})
export class ToolManagerService {

  private activeTool!: Tool;

  public activeToolRenderer: any;

  constructor(
    private pointTool: PointToolService
  ) { }

  setActiveTool(toolName: string) {
    debugger
    switch (toolName) {
      case 'point':
        this.activeTool = this.pointTool;
        break;
      case 'compass':
        this.activeToolRenderer = toolName;
        break;
      default:
        console.warn(`Unknown tool: ${toolName}`);
        this.activeTool = this.pointTool; // fallback
    }
  }

  handleClick(view: any, x: number, y: number) {
    if (this.activeTool) {
      this.activeTool.handleClick(view, x, y);
    }
  }

  
}
