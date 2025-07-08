import { TestBed } from '@angular/core/testing';

import { HintGenerationService } from './hint-generation.service';

describe('HintGenerationService', () => {
  let service: HintGenerationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HintGenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
