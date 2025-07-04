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

    // Deselecting same tool
    if (this.activeToolName === toolName) {
      if (this.toolMap[toolName]) {
        this.activeTool = null;
        this.activeToolName = null;
      }

      if (isPassive) {
        this.hideTool(toolName); // Remove protractor/compass from canvas
        this.renderedToolSet.delete(toolName); // Remove from renderedToolSet
        this.protractorTool.clearBlockingRegions(); // ❗️Clear blocked areas
      }

      return;
    }

    // Selecting a passive tool
    if (isPassive) {
      this.activeTool = null; // ❗️Disable active tool
      this.activeToolName = toolName;
      this.renderedToolSet.add(toolName); // Show on canvas
      return;
    }

    // Selecting an interactive tool
    this.activeToolName = toolName;
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
}
