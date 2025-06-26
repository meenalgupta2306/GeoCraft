import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProtractorRendererComponent } from './protractor-renderer.component';

describe('ProtractorRendererComponent', () => {
  let component: ProtractorRendererComponent;
  let fixture: ComponentFixture<ProtractorRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProtractorRendererComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProtractorRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
