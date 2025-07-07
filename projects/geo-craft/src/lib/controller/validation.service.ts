import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { ConstructionService } from './construction.service';
import { ToolManagerService } from './tool-manager.service';
import { ViewStateService } from '../view/services/view-state.service';
import {
  InteractiveTool,
  isPassiveTool,
  PassiveTool,
} from './interfaces/tools-interface';
import { HintGenerationService } from './hint-generation.service';
import { Socket } from 'dgram';

@Injectable({
  providedIn: 'root',
})
export class ValidationService {
  private dependencyMessages: Record<string, (step: any) => string> = {
    segment: () => 'Please draw the required segment first.',
    protractor: (step) => {
      const dependentStep = this.getGeoElementByStepId(step.depends[0]);
      return `Please place the protractor on the base segment ${dependentStep.start.label}${dependentStep.end.label}.`;
    },
    point: () => 'Please plot the required point first.',
  };

  private socket: any;
  private prompt = `You are assisting in evaluating a user's progress in a geometry construction activity, where each construction follows a predefined sequence of steps involving tools such as point, segment, and protractor. Each step may depend on the completion of earlier steps, specified using a depends array. You will be given the complete list of expected steps, a labelSensitive flag that tells whether point labels must match exactly, a completedStepMap that maps completed step IDs to internal geometry IDs, and the current geometric object created by the user. Your task is to determine which step (stepId) the user is currently trying to perform. If the action does not correspond to any expected step, return stepId: 0. Also check for unmet dependencies: if the user’s current step depends on others that are not yet completed, guide the user toward the first unmet prerequisite with a short, helpful hint. The user's geometric input will match one of the following strict structures:

Point: { tool: "point", x: number, y: number, label: string }

Segment: { tool: "segment", start: Point, end: Point }

Protractor: { tool: "protractor", center: Point, baseSegment?: Segment, protractorAxis?: Segment }

Here, baseSegment is the user's segment object, and protractorAxis is the protractors axis to check if it algins with base segment or not. YOu need to always check if protractor vertex as asked in the question is correct or not and protractor axis algins with base segment or not. After analyzing the user’s action and validating its dependencies, return a response in strict JSON format: { stepId: number, hint: string }. The hint should be short, clear, and user-friendly — designed to nudge the user toward the correct next step without referring to internal step numbers or logic. Try to help out rather than giving away the step as it is. Provide friendly messages on correct steps congratulate on completing the entire question when all steps are done, motivate when user is stuggling. 

at any step you could be required to do some calculation based oo its current step config or the step to which it was dependent. do the required calculation then tell the hint

point to note: do not check labels if labelSensitive is false otherwise you need to strictly match labels also. Your reponse shoud strictly comprised of only json {stepId, hint}, do not give any explanation or any anlysis..
.`;
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
    private viewState: ViewStateService,
    private hintGenerationService: HintGenerationService
  ) {
    // this.socket = io('https://192.1.150.232:8000' + '/gpt', {
    //   transports: ['polling'],
    // });
    // this.socket.emit(
    //   'create_chatbot',
    //   {
    //     instruction: this.prompt,
    //     userUUID: '3b12f1df-5232-4e2f-8f44-92c9bfb894e1',
    //   },
    //   () => {
    //     // this.socket.emit('user_response', {
    //     //   query:
    //     //     'Help me solve the question. ' +
    //     //     '\nQuestion:\nPlot each of the following points:  (-3, 0)  (3,0)  (1.2, 2.5)\n',
    //     //   isCreateThread: true,
    //     // });
    //   }
    // );
  }

  ngOnInit() {
    console.log('ValidationService initialized');
  }

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

    if (tool != 'protractor') {
      const query = `completedStepMap=${JSON.stringify([
        ...this.completedStepMap,
      ])}, lastElement=${JSON.stringify(lastElement)}`;
      console.log(query);
      this.socket.emit('user_response', {
        query: query,
        isCreateThread: true,
      });

      console.log('last element', elements);
      console.log('config', this.config);

      let message;
      this.socket.on('response', async (data: any) => {
        try {
          let res = JSON.parse(data.response);
          message = res.hint;
          console.log(message);
        } catch (error) {
          console.log(error);
        }
      });
      this.viewState.emitmessage(message);
    }

    for (const step of pendingSteps) {
      if (step.tool !== tool) continue;

      const depsMet = this.validateDependency(step);
      if (!depsMet) {
        const firstUnmet = this.getFirstIncompleteDependency(step);
        const unmetDependencyStep = this.findStepById(firstUnmet);
        this.viewState.emitmessage(
          this.dependencyMessages[unmetDependencyStep.tool](
            unmetDependencyStep
          ) || null
        );
        return;
      }
      const result = toolService.validate(
        step,
        lastElement,
        this.config.labelSensitive
      );
      console.log('validation result', step.tool);
      if (step.tool === 'protractor') {
        const element = this.constructionService.getGeoElements()[lastIndex];

        element.baseSegment = result.outputObject;
        this.constructionService.updateGeoElement(lastIndex, element);
        const query = `completedStepMap=${JSON.stringify([
          ...this.completedStepMap,
        ])}, lastElement=${JSON.stringify(element)}`;
        this.socket.emit('user_response', {
          query: query,
          isCreateThread: true,
        });

        let message;
        this.socket.on('response', async (data: any) => {
          try {
            let res = JSON.parse(data.response);
            message = res.hint;
          } catch (error) {
            console.log('error');
          }
        });
        if (result) this.viewState.emitmessage(message);
      }
      // this.displayMessage(result, step.id, lastIndex);
      if (result.matched) {
        this.markStepAsCompleted(step.id, lastIndex);
        break;
      }
    }
  }

  registerSocket(socket: Socket) {
    this.socket = socket;
  }

  // sanitizeResponse(response: any) {
  //   try {
  //     const sanitizedResponse = response
  //       .replace(/\\|[\n\r]|,\s*(?=[}\]])|\s+(?=:)|:\s+/g, '') // Remove unwanted characters
  //       .replace(/(?<=\{|:)\s*'([^']*)'\s*(?=[,}])/g, '"$1"') // Replace invalid single quotes around keys/values
  //       .replace(/"\s*'/g, '"') // Replace single quotes inside double quotes
  //       .replace(/'\s*"/g, '"'); // Replace single quotes before double quotes

  //     const parsedData = JSON.parse(sanitizedResponse);
  //     return parsedData;
  //   } catch (error) {
  //     console.error('Failed to parse JSON:', error);
  //   }
  // }

  displayMessage(result: any, stepId: number, lastIndex: number) {
    let message;

    this.socket.on('response', async (data: any) => {
      console.log(data.response['hint'], 'data');

      message = data.response['hint'] || null;
    });
    if (result.matched) {
      this.markStepAsCompleted(stepId, lastIndex);
      const element = this.constructionService.getGeoElements()[lastIndex];
      // element.baseSegment = result.outputObject;
      // this.constructionService.updateGeoElement(lastIndex, element);
      message = null;
      if (this.isComplete()) {
        message = '✅ Well done! You have successfully solved it.';
      } else {
        message = result?.reason || 'Well done!';
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
