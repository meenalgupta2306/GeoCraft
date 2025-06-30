import { TestBed } from '@angular/core/testing';

import { StepEvaluatorService } from './step-evaluator.service';

describe('StepEvaluatorService', () => {
  let service: StepEvaluatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StepEvaluatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
