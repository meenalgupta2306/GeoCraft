import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { ViewStateService } from './view/services/view-state.service';
import { config } from '../lib/config/config.json';
import { ValidationService } from './controller/validation.service';
import { ConstructionService } from './controller/construction.service';
import { EventLogService } from './controller/event-log.service';
import { io } from 'socket.io-client';
import { ToolManagerService } from './controller/tool-manager.service';
import { GeoCraftViewComponent } from './view/geo-craft-view/geo-craft-view.component';
import { ToolBarComponent } from './view/tool-bar/tool-bar.component';

@Component({
  selector: 'lib-geo-craft',
  templateUrl: './geo-craft.component.html',
  styleUrls: ['./geo-craft.component.scss'],
})
export class GeoCraftComponent implements OnInit {
  @Output() validationMessage = new EventEmitter<string>();
  @ViewChild('geoCraftView') viewRef!: GeoCraftViewComponent;
  @ViewChild(ToolBarComponent) toolBarComponent!: ToolBarComponent;

  config = {
    showGrid: true,
    snapToGrid: true,
    gridStep: 1,
  };

  openToolBar: boolean = true;
  currentQuestion = 0;
  private socket: any;
  private prompt = `You are assisting in evaluating a user's progress in a geometry construction activity, where each construction follows a predefined sequence of steps involving tools such as point, segment, and protractor. Each step may depend on the completion of earlier steps, specified using a depends array. You will be given the complete list of expected steps, a labelSensitive flag that tells whether point labels must match exactly, a completedStepMap that maps completed step IDs to internal geometry IDs, and the current geometric object created by the user. Your task is to determine which step (stepId) the user is currently trying to perform. If the action does not correspond to any expected step, return stepId: 0. Also check for unmet dependencies: if the user’s current step depends on others that are not yet completed, guide the user toward the first unmet prerequisite with a short, helpful hint. The user's geometric input will match one of the following strict structures:

Point: { tool: "point", x: number, y: number, label: string }

Segment: { tool: "segment", start: Point, end: Point }

Protractor: { tool: "protractor", center: Point, baseSegment?: Segment, protractorAxis?: Segment }

Here, baseSegment is the user's segment object, and protractorAxis is the protractors axis to check if it algins with base segment or not. YOu need to always check if protractor vertex as asked in the question is correct or not and protractor axis algins with base segment or not. After analyzing the user’s action and validating its dependencies, return a response in strict JSON format: { stepId: number, hint: string }. The hint should be short, clear, and user-friendly — designed to nudge the user toward the correct next step without referring to internal step numbers or logic. Try to help out rather than giving away the step as it is. Provide friendly messages on correct steps congratulate on completing the entire question when all steps are done, motivate when user is stuggling. 

at any step you could be required to do some calculation based oo its current step config or the step to which it was dependent. do the required calculation then tell the hint

point to note: do not check labels if labelSensitive is false otherwise you need to strictly match labels also. If labelSensitive is false then dont go for the labels just check the coordinates and respond accordingly. Reponse shoud strictly comprised of only json {stepId, hint}, do not give any explanation or any anlysis..`;

  questions = [
    '1. Plot each of the following points:  (-3, 0)  (3,0)  (1.2, 2.5)',
    '2. Draw a line segment of length 6.8 cm',
    '3. Construct an angle of 105 with the help of a protractor',
    '4. Draw a line segment AB= 5 cm.Construct a line perpendicular to the segment on point A such that AC= 4 cm',
    '5. Using only a protractor, draw an obtuse angle',
  ];

  constructor(
    private viewState: ViewStateService,
    private validationService: ValidationService,
    private constructionService: ConstructionService,
    private eventLogService: EventLogService,
    private toolManager: ToolManagerService
  ) {}

  ngOnInit(): void {
    this.viewState.setCanvasConfig(this.config);
    this.viewState.errorMessage.subscribe((msg) => {
      this.validationMessage.emit(msg);
    });
    this.initializeSocket();
  }

  initializeSocket() {
    console.log('socket');

    this.socket = io('https://192.1.150.232:8000/gpt', {
      transports: ['polling'],
    });

    this.socket.emit('create_chatbot', {
      instruction:
        this.prompt +
        'Question: ' +
        this.questions[this.currentQuestion] +
        JSON.stringify(config[this.currentQuestion]),
      userUUID: '3b12f1df-5232-4e2f-8f44-92c9bfb894e1',
    });

    this.validationService.registerSocket(this.socket);
  }

  toggle() {
    this.openToolBar = !this.openToolBar;
  }

  next() {
    this.currentQuestion++;
    if (this.currentQuestion === 5) this.currentQuestion = 0;

    this.toolManager.resetTools(); // ✅ Clear tools (active/passive)
    this.constructionService.clear(); // ✅ Clear geoElements
    this.validationService.reset(); // ✅ Clear completed/deferred steps
    this.eventLogService.clear(); // ✅ Clear logs

    this.validationService.loadConfig(config[this.currentQuestion]);

    if (this.viewRef) {
      this.viewRef.resetView();
    }
    if (this.toolBarComponent) {
      this.toolBarComponent.clearSelectedTools();
    }
    this.initializeSocket();
  }
}
