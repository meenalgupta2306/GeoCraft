import { Injectable } from '@angular/core';
import { ConstructionService } from './construction.service';
import { ToolManagerService } from './tool-manager.service';
import { ViewStateService } from '../view/services/view-state.service';

@Injectable({
  providedIn: 'root',
})
export class ValidationService {
  private geoElements: any[] = [];
  private config: any;
  private steps: any;
  private completedStepMap = new Map<number, number>(); // stepId → geoIndex
  private deferredSteps = new Map<
    number,
    { depends: number[]; geoIndex: number }
  >();

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

  hasStep(stepId: number): boolean {
    return this.completedStepMap.has(stepId);
  }

  markStepAsCompleted(stepId: number, geoIndex: number): void {
    this.completedStepMap.set(stepId, geoIndex);
  }

  getGeoElementByStepId(stepId: number): any | null {
    const geoIndex = this.completedStepMap.get(stepId);
    return geoIndex !== undefined
      ? this.constructionService.getGeoElements()[geoIndex]
      : null;
  }

  isComplete(): boolean {
    return this.completedStepMap.size === this.config.steps.length;
  }

  startValidation() {
    const elements = this.constructionService.getGeoElements();
    const lastIndex = elements?.length - 1;
    const lastElement = elements[lastIndex];
    const tool = lastElement.tool;
    const toolService = this.toolManager.toolMap[tool];
    const pendingSteps = this.getPendingSteps();

    if (!toolService || !lastElement) return;
    let flag = false;
    let message;
    let deferredResult;

    for (const step of pendingSteps) {
      if (step.tool !== tool) continue;

      // // ✅ Step 1: Check dependency first
      // const depsMet =
      //   !step.depends || step.depends.every((id: number) => this.hasStep(id));

      // if (!depsMet) {
      //   message = 'Dependency not done';
      //   this.deferredSteps.set(step.id, {
      //     depends: step.depends || [],
      //     geoIndex: lastIndex,
      //   });
      //   continue;
      // }

      // ✅ Step 2: Validate only if deps are satisfied
      const result = toolService.validate(
        step,
        lastElement,
        this.config.labelSensitive
      );

      if (result.matched) {
        const depsMet =
          !step.depends || step.depends.every((id: number) => this.hasStep(id));

        if (!depsMet) {
          message = 'Dependency not done';
          this.deferredSteps.set(step.id, {
            depends: step.depends || [],
            geoIndex: lastIndex,
          });
          continue;
        }
        if (depsMet) {
          this.markStepAsCompleted(step.id, lastIndex);
          this.deferredSteps.delete(step.id);

          debugger;
          // ✅ Step 3: Validate previously deferred steps depending on this
          deferredResult = this.validateDeferedSteps(step.id);

          flag = true;
          message = deferredResult?.reason || null;

          break; // Done with current element
        }
      } else {
        this.deferredSteps.set(step.id, {
            depends: step.depends || [],
            geoIndex: lastIndex,
          });
        message = result.reason;
      }
    }
    if (flag || deferredResult?.matched) {
      if (this.isComplete()) {
        message = '✅ Well done! You have successfully solved it.';
      } else {
        if (deferredResult && !deferredResult?.matched) {
          message = `Well done! ${deferredResult?.reason}`;
        } else {
          message = 'Well done!';
        }
      }
      this.viewState.emitmessage(message);
    }
    this.viewState.emitmessage(message || null);
  }

  validateDeferedSteps(currentValidatedStepId: number) {
    let result;
    for (const [stepId, info] of this.deferredSteps) {
      debugger;
      if (!info.depends.includes(currentValidatedStepId)) continue;

      const depsNowMet = info.depends.every((id) => this.hasStep(id));
      if (!depsNowMet) continue;

      const element = this.constructionService.getGeoElements()[info.geoIndex];
      const step = this.steps.find((s: any) => s.id === stepId);
      const toolService = this.toolManager.toolMap[step.tool];
      if (!toolService) continue;

      result = toolService.validate(step, element, this.config.labelSensitive);
      if (result.matched) {
        this.markStepAsCompleted(stepId, info.geoIndex);
        this.deferredSteps.delete(stepId);
      }
    }
    return result;
  }

  /* startValidation() {
    const elements = this.constructionService.getGeoElements();
    const lastIndex = elements.length - 1;
    const pendingSteps = this.getPendingSteps();

    debugger;
    //for (let i = 0; i < elements.length; i++) {
      const element = elements[lastIndex];
      const tool = element.tool;

      const toolService = this.toolManager.toolMap[tool];
      // if (!toolService) continue;

      for (const step of pendingSteps) {
        if (step.tool !== tool) continue;

        //check all dependencies are completed
        const depsMet =
          !step.depends || step.depends.every((id: number) => this.hasStep(id));

        //continue to next if dependencies are not done

        const result = toolService.validate(
          step,
          element,
          this.config.labelSensitive
        );
         if (!depsMet) {
          this.viewState.emitmessage('dependency not done');
          this.deferredSteps.set(step.id, {
            depends: step.depends || [],
            geoIndex: lastIndex,
          });

          continue;
        }


        if (result.matched && depsMet) {
          this.markStepAsCompleted(step.id, lastIndex);
          const allCompleted = this.config.steps.every((step: any) =>
            this.completedStepMap.has(step.id)
          );

          this.viewState.emitmessage(
            allCompleted ? 'Well done! you ahve succesfully solved it.' : null
          );

          this.validateDeferedSteps(step.id);
          break;
        } else if (
          result.reason  &&
          tool === this.toolManager.activeToolName
        ) {
          this.viewState.emitmessage(result.reason);
        }
      }
    // }
  }

  validateDeferedSteps(completedStepId: number) {
    for (const [stepId, info] of this.deferredSteps) {
      if (!info.depends.includes(completedStepId)) continue;

      const depsNowMet = info.depends.every((id) => this.hasStep(id));
      if (!depsNowMet) continue;

      const element = this.constructionService.getGeoElements()[info.geoIndex];
      const step = this.steps.find((s: any) => s.id === stepId);
      const toolService = this.toolManager.toolMap[step.tool];
      if (!toolService) continue;

      const result = toolService.validate(
        step,
        element,
        this.config.labelSensitive
      );
      if (result.matched) {
        this.markStepAsCompleted(stepId, info.geoIndex);
        this.deferredSteps.delete(stepId);
      }
    }
  } */
}
