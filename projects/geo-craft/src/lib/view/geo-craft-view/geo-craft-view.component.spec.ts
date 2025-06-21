import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeoCraftViewComponent } from './geo-craft-view.component';

describe('GeoCraftViewComponent', () => {
  let component: GeoCraftViewComponent;
  let fixture: ComponentFixture<GeoCraftViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeoCraftViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeoCraftViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
