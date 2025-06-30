import { Injectable } from '@angular/core';

import {Tool} from './tools/tools-interface';
import { PointToolService } from './tools/point-tool.service';
import { SegmentToolService } from './tools/segment-tool.service';
import { StepEvaluatorService } from './step-evaluator.service';

@Injectable({
  providedIn: 'root'
})
export class ToolManagerService {

  private activeTool: Tool| null = null;

  public activeToolRenderer: any;
  public activeToolName: any;

  constructor(
    private pointTool: PointToolService,
    private segmentTool: SegmentToolService,
    private stepEvaluator: StepEvaluatorService
  ) { }

  setActiveTool(toolName: string) {
    debugger
    this.activeToolName = toolName
    switch (toolName) {
      case 'point':
        this.activeTool = this.pointTool;
        break;
      case 'segment':
        this.activeTool = this.segmentTool;
        break;
      // case 'compass' :
      // case 'protractor':
      //   this.activeToolRenderer = toolName;
      //   break;
      default:
        console.warn(`Unknown tool: ${toolName}`);
        this.activeTool = null; // fallback
    }
  }

 
  handlePointerDown(view: any, x: number, y: number) {
    debugger
    this.activeTool?.handlePointerDown?.(view, x, y);
  }

  handlePointerUp(view: any, x: number, y: number) {
    this.activeTool?.handlePointerUp?.(view, x, y);
  }

  validate(){
    const {id, params, labelSensitive} = this.stepEvaluator.validateConstruction(this.activeToolName);
    this.activeTool?.validate(id, params, labelSensitive);
  }

  check(){
    
  }

  
}
