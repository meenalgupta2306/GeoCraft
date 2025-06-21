import { TestBed } from '@angular/core/testing';

import { PointToolService } from './point-tool.service';

describe('PointToolService', () => {
  let service: PointToolService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PointToolService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
