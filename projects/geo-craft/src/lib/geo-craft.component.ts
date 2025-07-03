import { Component, OnInit, Input } from '@angular/core';
import { ViewStateService } from './view/services/view-state.service';
import { config } from '../lib/config/config.json';
import { StepEvaluatorService } from './controller/step-evaluator.service';

@Component({
  selector: 'lib-geo-craft',
  templateUrl: './geo-craft.component.html',
  styleUrls: ['./geo-craft.component.scss'],
})
export class GeoCraftComponent implements OnInit {
  config = {
    showGrid: true,
    snapToGrid: true,
    gridStep: 1,
  };

  openToolBar: boolean = true;
  currentQuestion = 0;

  questions = [
    '1. Plot each of the following points:  (-3, 0)  (3,0)  (1.2, 2.5)',
    '2. Draw a line segment of length 6.8 cm',
    '3. Construct an angle of 105 with the help of a protractor',
    '4. Draw a line segment AB= 5 cm.Construct a line perpendicular to the segment on point A such that AC= 4 cm',
    '5. Using only a protractor, draw an obtuse angle',
  ];

  constructor(
    private viewState: ViewStateService,
    private stepEvaluator: StepEvaluatorService
  ) {}

  ngOnInit(): void {
    this.viewState.setCanvasConfig(this.config);
  }

  toggle() {
    this.openToolBar = !this.openToolBar;
  }

  next() {
    this.currentQuestion++;
    if (this.currentQuestion == 5) this.currentQuestion = 0;
    this.stepEvaluator.loadConfig(config[this.currentQuestion]);
  }
}
