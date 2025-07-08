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
import { ToolManagerService } from './controller/tool-manager.service';
import { GeoCraftViewComponent } from './view/geo-craft-view/geo-craft-view.component';
import { ToolBarComponent } from './view/tool-bar/tool-bar.component';
import { HintGenerationService } from './view/services/hint-generation.service';
import {identifyStepInstruction, questionFormat, hintGenerationPrompt} from "./config/prompts/prompt";
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
  resetCanvas = false;

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
    private toolManager: ToolManagerService,
    private hintGenerationService: HintGenerationService
  ) {}

  async ngOnInit() {
    this.viewState.setCanvasConfig(this.config);
    this.viewState.errorMessage.subscribe((msg) => {
      this.validationMessage.emit(msg);
    });
    const prompt = identifyStepInstruction + questionFormat((this.questions[this.currentQuestion]), config[this.currentQuestion].steps);
    console.log(prompt);

    await this.hintGenerationService.createAssistant(
      'step',
      'Step Identifier',
      prompt
    )

    await this.hintGenerationService.createThreadFor('step')
    console.log(hintGenerationPrompt)
    await this.hintGenerationService.createAssistant(
      'hint',
      'Hint Evaluator',
      hintGenerationPrompt
    )

    await this.hintGenerationService.createThreadFor('hint')
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
  }

  clearCanvas() {
    this.resetCanvas = true;
    setTimeout(() => {
      this.resetCanvas = false;
    }, 0);
  }
}
