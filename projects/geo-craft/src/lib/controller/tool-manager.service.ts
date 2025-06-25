import { Injectable } from '@angular/core';

import {Tool} from './tools/tools-interface';
import { PointToolService } from './tools/point-tool.service';
import { SegmentToolService } from './tools/segment-tool.service';

@Injectable({
  providedIn: 'root'
})
export class ToolManagerService {

  private activeTool!: Tool;

  public activeToolRenderer: any;

  constructor(
    private pointTool: PointToolService,
    private segmentTool: SegmentToolService
  ) { }

  setActiveTool(toolName: string) {
    debugger
    switch (toolName) {
      case 'point':
        this.activeTool = this.pointTool;
        break;
      case 'segment':
        this.activeTool = this.segmentTool;
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

  handleMove(view: any, x: number, y: number){
    if(this.activeTool){
      this.activeTool.handleMove(view, x, y);
    }
  }
  handlePointerDown(view: any, x: number, y: number) {
    this.activeTool?.handlePointerDown?.(view, x, y);
  }

  handlePointerUp(view: any, x: number, y: number) {
    this.activeTool?.handlePointerUp?.(view, x, y);
  }

  
}
