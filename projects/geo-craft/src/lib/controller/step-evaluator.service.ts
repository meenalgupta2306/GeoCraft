import { Injectable } from '@angular/core';
import { ToolManagerService } from './tool-manager.service';
@Injectable({
  providedIn: 'root',
})
export class StepEvaluatorService {
  private config: any;
  private steps: any;
  private completedStepIds = new Set<number>();

  constructor(public toolManager: ToolManagerService) {}
  loadConfig(config: any): void {
    this.config = config;
    this.steps = config.steps;
    this.completedStepIds.clear();
  }

  getPendingSteps() {
    return this.steps.filter(
      (step: any) => !this.completedStepIds.has(step.id)
    );
  }

  markStepAsCompleted(stepId: number): void {
    this.completedStepIds.add(stepId);
  }

  reset(): void {
    this.completedStepIds.clear();
  }
  isComplete(): boolean {
    return this.completedStepIds.size === this.steps.length;
  }
  validateConstruction(toolName: string) {
    const pendingSteps = this.getPendingSteps()

    for (const step of pendingSteps) {
      const expectedTool = step.tool;

      if (expectedTool !== toolName) continue;

      else{
        return {
          step,
          labelSensitive: this.config.labelSensitive
        }
      }
    }
    return {
      step: null,
      labelSensitive: this.config.labelSensitive
    };
  }
}
