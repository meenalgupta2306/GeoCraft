import { TestBed } from '@angular/core/testing';

import { ProtractorToolService } from './protractor-tool.service';

describe('ProtractorToolService', () => {
  let service: ProtractorToolService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProtractorToolService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
