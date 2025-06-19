import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeoCraftComponent } from './geo-craft.component';

describe('GeoCraftComponent', () => {
  let component: GeoCraftComponent;
  let fixture: ComponentFixture<GeoCraftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeoCraftComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeoCraftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
