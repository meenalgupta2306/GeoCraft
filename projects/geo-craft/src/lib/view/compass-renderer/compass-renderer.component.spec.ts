import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompassRendererComponent } from './compass-renderer.component';

describe('CompassRendererComponent', () => {
  let component: CompassRendererComponent;
  let fixture: ComponentFixture<CompassRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompassRendererComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompassRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
