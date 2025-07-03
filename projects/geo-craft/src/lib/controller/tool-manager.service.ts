import { Injectable } from '@angular/core';

import { Tool } from './interfaces/tools-interface';
import { PointToolService } from './tools/point-tool.service';
import { SegmentToolService } from './tools/segment-tool.service';

@Injectable({
  providedIn: 'root',
})
export class ToolManagerService {
  private activeTool: Tool | null = null;
  public activeToolName: any;

  public renderedToolSet = new Set<string>();

  public toolMap: Record<string, Tool>;

  constructor(
    private pointTool: PointToolService,
    private segmentTool: SegmentToolService,
  ) {
    this.toolMap = {
      point: this.pointTool,
      segment: this.segmentTool,
    };
  }

  setActiveTool(toolName: string) {
    if (this.activeToolName === toolName) {
      if (this.toolMap[toolName]) {
        this.activeTool = null;
        this.activeToolName = null;
      }
      if (['protractor', 'compass'].includes(toolName)) {
        this.hideTool(toolName);
        this.activeToolName = null;
      }
      return;
    }
    this.activeToolName = toolName;
    if (this.toolMap[toolName]) {
      this.activeTool = this.toolMap[toolName];
    }
    if (['protractor', 'compass'].includes(toolName)) {
      this.renderedToolSet.add(toolName);
    }
  }

  isToolRendered(toolName: string): boolean {
    return this.renderedToolSet.has(toolName);
  }

  hideTool(toolName: string) {
    this.renderedToolSet.delete(toolName);
  }

  getRenderedTools(): string[] {
    return Array.from(this.renderedToolSet);
  }

  handlePointerDown(view: any, x: number, y: number) {
    this.activeTool?.handlePointerDown?.(view, x, y);
  }

  handlePointerUp(view: any, x: number, y: number) {
    this.activeTool?.handlePointerUp?.(view, x, y);
    this.validate();
  }

  // validate() {
  //   const { step, labelSensitive } = this.stepEvaluator.validateConstruction(
  //     this.activeToolName
  //   );
  //   this.activeTool?.validate(step, labelSensitive);
  // }

  check() {}
}
