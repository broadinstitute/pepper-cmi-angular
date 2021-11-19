import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FieldTypeaheadComponent } from './field-typeahead.component';

describe('FieldTypeaheadComponent', () => {
  let component: FieldTypeaheadComponent;
  let fixture: ComponentFixture<FieldTypeaheadComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FieldTypeaheadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldTypeaheadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
