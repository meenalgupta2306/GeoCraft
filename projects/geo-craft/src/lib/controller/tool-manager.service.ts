import { Injectable } from '@angular/core';
import {
  InteractiveTool,
  isInteractiveTool,
  PassiveTool,
} from './interfaces/tools-interface';
import { PointToolService } from './tools/point-tool.service';
import { SegmentToolService } from './tools/segment-tool.service';
import { ProtractorToolService } from './tools/protractor-tool.service';

@Injectable({
  providedIn: 'root',
})
export class ToolManagerService {
  private activeTool: InteractiveTool | null = null;
  public activeToolName: string | null = null;

  public renderedToolSet = new Set<string>();

  public toolMap: Record<string, InteractiveTool | PassiveTool>;

  constructor(
    private pointTool: PointToolService,
    private segmentTool: SegmentToolService,
    private protractorTool: ProtractorToolService
  ) {
    this.toolMap = {
      point: this.pointTool,
      segment: this.segmentTool,
      protractor: this.protractorTool,
    };
  }

  setActiveTool(toolName: string) {
    const isPassive = ['protractor', 'compass'].includes(toolName);

    const alreadySelected =
      (!isPassive && this.activeToolName === toolName) ||
      (isPassive && this.renderedToolSet.has(toolName));

    if (alreadySelected) {
      this.activeTool = null;
      this.activeToolName = null;

      if (isPassive) {
        this.hideTool(toolName);
        this.protractorTool.clearBlockingRegions(); // ✅ Remove blocked regions
      }

      return;
    }

    // Selecting an interactive tool
    this.activeToolName = toolName;

    if (isPassive) {
      this.activeTool = null;
      this.renderedToolSet.add(toolName);
      return;
    }

    const tool = this.toolMap[toolName];
    if (isInteractiveTool(tool)) {
      this.activeTool = tool;
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
    this.activeTool?.handlePointerDown(view, x, y);
  }

  handlePointerUp(view: any, x: number, y: number) {
    this.activeTool?.handlePointerUp(view, x, y);
  }

  shouldValidatePassiveTool(toolName: string): boolean {
    if (toolName === 'protractor') {
      const isLocked = this.protractorTool.isLocked();
      return isLocked;
    }
    return true;
  }

  isWorldPointInBlockedTool(x: number, y: number): boolean {
    const result = this.protractorTool.isPointInBlockedArea(x, y);
    return result;
  }

  resetTools() {
    this.activeTool = null;
    this.activeToolName = null;
    this.renderedToolSet.clear();

    this.protractorTool.clearBlockingRegions();
  }
}
