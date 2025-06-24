import { TestBed } from '@angular/core/testing';

import { CompassToolService } from './compass-tool.service';

describe('CompassToolService', () => {
  let service: CompassToolService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompassToolService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
