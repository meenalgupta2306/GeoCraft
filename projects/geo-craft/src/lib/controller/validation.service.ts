import { Injectable } from '@angular/core';
import { ConstructionService } from './construction.service';
import { ToolManagerService } from './tool-manager.service';
import { ViewStateService } from '../view/services/view-state.service';
import {
  InteractiveTool,
  isPassiveTool,
  PassiveTool,
} from './interfaces/tools-interface';

@Injectable({
  providedIn: 'root',
})
export class ValidationService {
  private dependencyMessages: Record<string, string> = {
    segment: 'Please draw the required segment first.',
    protractor: 'Please place the protractor before measuring an angle.',
    point: 'Please plot the required point first.',
  };

  private geoElements: any[] = [];
  private config: any;
  private steps: any;
  private completedStepMap = new Map<number, number>(); // stepId → geoIndex
  private deferredSteps = new Map<
    number,
    { depends: number[]; geoIndex: number }
  >();
  currentStepId: number | null = null;

  constructor(
    private constructionService: ConstructionService,
    private toolManager: ToolManagerService,
    private viewState: ViewStateService
  ) {}

  loadConfig(config: any): void {
    this.config = config;
    this.steps = config.steps;
  }

  reset(): void {
    this.completedStepMap.clear();
  }

  getPendingSteps(): any[] {
    return this.config.steps.filter(
      (step: any) => !this.completedStepMap.has(step.id)
    );
  }

  isStepCompleted(stepId: number): boolean {
    return this.completedStepMap.has(stepId);
  }

  markStepAsCompleted(stepId: number, geoIndex: number): void {
    this.completedStepMap.set(stepId, geoIndex);
  }

  getGeoElementByStepId(stepId: number): any | null {
    const geoIndex = this.completedStepMap.get(stepId);
    const obj =
      geoIndex !== undefined
        ? this.constructionService.getGeoElements()[geoIndex]
        : null;
    return obj;
  }

  isComplete(): boolean {
    return this.completedStepMap.size === this.config.steps.length;
  }

  startValidation() {
    const elements = this.constructionService.getGeoElements();
    if (!elements.length) return;

    const lastIndex = elements?.length - 1;
    const lastElement = elements[lastIndex];
    const tool = lastElement.tool;
    const toolService: InteractiveTool | PassiveTool =
      this.toolManager.toolMap[tool] || this.getPassiveTool(tool);
    const pendingSteps = this.getPendingSteps();
    if (!toolService || !lastElement) return;

    this.viewState.emitmessage(null);

    for (const step of pendingSteps) {
      if (step.tool !== tool) continue;

      const depsMet = this.validateDependency(step);
      if (!depsMet) {
        const firstUnmet = this.getFirstIncompleteDependency(step);
        const unmetDependencyStep = this.findStepById(firstUnmet);
        this.viewState.emitmessage(
          this.dependencyMessages[unmetDependencyStep.tool] || null
        );
        return;
      }
      const result = toolService.validate(
        step,
        lastElement,
        this.config.labelSensitive
      );
      this.displayMessage(result, step.id, lastIndex);
      if (result.matched) break;
    }
  }

  displayMessage(result: any, stepId: number, lastIndex: number) {
    let message;
    if (result.matched) {
      this.markStepAsCompleted(stepId, lastIndex);
      const element = this.constructionService.getGeoElements()[lastIndex];
      element.baseSegment = result.outputObject;
      this.constructionService.updateGeoElement(lastIndex, element);
      message = null;
      if (this.isComplete()) {
        message = '✅ Well done! You have successfully solved it.';
      } else {
        message = 'Well done!';
      }
    } else {
      message = result.reason;
    }
    this.viewState.emitmessage(message || null);
  }

  validateDeferedSteps(currentValidatedStepId: number) {
    let result;
    for (const [stepId, info] of this.deferredSteps) {
      if (!info.depends.includes(currentValidatedStepId)) continue;

      const depsNowMet = info.depends.every((id) => this.isStepCompleted(id));
      if (!depsNowMet) continue;

      const element = this.constructionService.getGeoElements()[info.geoIndex];
      const step = this.steps.find((s: any) => s.id === stepId);

      const toolService: InteractiveTool | PassiveTool =
        this.toolManager.toolMap[step.tool] || this.getPassiveTool(step.tool);

      if (!toolService) continue;
    }
  }

  private getPassiveTool(toolName: string): PassiveTool | null {
    const tool = this.toolManager.toolMap[toolName];
    return isPassiveTool(tool) ? tool : null;
  }

  validateDependency(step: any) {
    const depsMet =
      !step.depends ||
      step.depends.every((id: number) => this.isStepCompleted(id));
    return depsMet;
  }

  findStepById(stepId: number): any | null {
    return this.steps.find((step: any) => step.id === stepId) || null;
  }
  // Helper to find the first unmet dependency recursively
  private getFirstIncompleteDependency(step: any): number {
    if (!step.depends || step.depends.length === 0) {
      return step.id;
    }

    for (const depId of step.depends) {
      if (!this.isStepCompleted(depId)) {
        const depStep = this.findStepById(depId);
        return this.getFirstIncompleteDependency(depStep);
      }
    }

    // All dependencies met
    return step.id;
  }
}
