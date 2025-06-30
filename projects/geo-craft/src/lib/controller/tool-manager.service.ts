import { Injectable } from '@angular/core';

import {Tool} from './tools/tools-interface';
import { PointToolService } from './tools/point-tool.service';
import { SegmentToolService } from './tools/segment-tool.service';
import { StepEvaluatorService } from './step-evaluator.service';

@Injectable({
  providedIn: 'root'
})
export class ToolManagerService {

  private activeTool!: Tool;

  public activeToolRenderer: any;
  public activeToolName: any;

  constructor(
    private pointTool: PointToolService,
    private segmentTool: SegmentToolService,
    private stepEvaluator: StepEvaluatorService
  ) { }

  setActiveTool(toolName: string) {
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
        this.activeTool = this.pointTool; // fallback
    }
  }

  handleClick(view: any, x: number, y: number) {
    this.activeTool?.handleClick?.(view, x, y);
  }

  handleMove(view: any, x: number, y: number){
    this.activeTool?.handleMove?.(view, x, y);
  }
  handlePointerDown(view: any, x: number, y: number) {
    this.activeTool?.handlePointerDown?.(view, x, y);
  }

  handlePointerUp(view: any, x: number, y: number) {
    this.activeTool?.handlePointerUp?.(view, x, y);
  }

  validate(){
    const {id, params, labelSensitive} = this.stepEvaluator.validateConstruction(this.activeToolName);
    const isValid = this.activeTool?.validate(params, labelSensitive);
    if(isValid && this.activeTool){  
    alert('validated');
        this.stepEvaluator.markStepAsCompleted(id);
        
      }else{
        alert("not correct")
      }
  }

  check(){
    
  }

  
}
