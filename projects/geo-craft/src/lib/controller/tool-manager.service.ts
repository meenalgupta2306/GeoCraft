import { Injectable } from '@angular/core';

import { Tool } from './tools/tools-interface';
import { PointToolService } from './tools/point-tool.service';
import { SegmentToolService } from './tools/segment-tool.service';
import { StepEvaluatorService } from './step-evaluator.service';

@Injectable({
  providedIn: 'root',
})
export class ToolManagerService {
  private activeTool: Tool | null = null;

  public activeToolRenderer: any;
  public activeToolName: any;

  public toolMap: Record<string, Tool>;

  constructor(
    private pointTool: PointToolService,
    private segmentTool: SegmentToolService,
    private stepEvaluator: StepEvaluatorService
  ) {
    this.toolMap = {
      point: this.pointTool,
      segment: this.segmentTool,
    };
  }

  setActiveTool(toolName: string) {
    this.activeToolName = toolName;

    this.activeTool = this.toolMap[toolName];
  }

  handlePointerDown(view: any, x: number, y: number) {
    this.activeTool?.handlePointerDown?.(view, x, y);
  }

  handlePointerUp(view: any, x: number, y: number) {
    this.activeTool?.handlePointerUp?.(view, x, y);
  }

  validate() {
    const { step, labelSensitive } = this.stepEvaluator.validateConstruction(
      this.activeToolName
    );
    this.activeTool?.validate(step, labelSensitive);
  }

  check() {}
}
