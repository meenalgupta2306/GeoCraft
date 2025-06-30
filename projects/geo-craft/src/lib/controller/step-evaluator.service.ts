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
          id: step.id,
          params: step.validate,
          labelSensitive: this.config.labelSensitive
        }
      }
      // console.log(this.toolManager)
      // this.toolManager.check();
      // const isValid = this.toolManager.validate(
      //   step.validate || null,
      //   this.config.labelSensitive
      // );

      // if (isValid) {
      //   alert('validated');
      //   this.markStepAsCompleted(step.id);
      //   break;
      // }else{
      //   alert("not correct")
      // }
    }
    return {
      params: null,
      labelSensitive: this.config.labelSensitive
    };
  }
}
