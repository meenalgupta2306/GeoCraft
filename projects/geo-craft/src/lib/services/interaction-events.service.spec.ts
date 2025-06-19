import { TestBed } from '@angular/core/testing';

import { InteractionEventsService } from './interaction-events.service';

describe('InteractionEventsService', () => {
  let service: InteractionEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InteractionEventsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
