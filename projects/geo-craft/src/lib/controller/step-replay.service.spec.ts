import { TestBed } from '@angular/core/testing';

import { StepReplayService } from './step-replay.service';

describe('StepReplayService', () => {
  let service: StepReplayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StepReplayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
