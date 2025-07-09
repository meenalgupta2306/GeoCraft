import { TestBed } from '@angular/core/testing';

import { LlmServiceService } from './llm-service.service';

describe('LlmServiceService', () => {
  let service: LlmServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LlmServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
