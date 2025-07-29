import { TestBed } from '@angular/core/testing';

import { ConfigMapperService } from './config-mapper.service';

describe('ConfigMapperService', () => {
  let service: ConfigMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigMapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
