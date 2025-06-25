import { TestBed } from '@angular/core/testing';

import { SegmentToolService } from './segment-tool.service';

describe('SegmentToolService', () => {
  let service: SegmentToolService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SegmentToolService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
