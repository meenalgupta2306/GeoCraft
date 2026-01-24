import { TestBed } from '@angular/core/testing';

import { FabricRendererService } from './fabric-renderer.service';

describe('FabricRendererService', () => {
  let service: FabricRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FabricRendererService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
