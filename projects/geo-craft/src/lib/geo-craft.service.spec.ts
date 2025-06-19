import { TestBed } from '@angular/core/testing';

import { GeoCraftService } from './geo-craft.service';

describe('GeoCraftService', () => {
  let service: GeoCraftService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoCraftService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
