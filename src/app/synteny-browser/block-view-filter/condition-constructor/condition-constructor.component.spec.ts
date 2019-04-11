import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConditionConstructorComponent } from './condition-constructor.component';

describe('ConditionConstructorComponent', () => {
  let component: ConditionConstructorComponent;
  let fixture: ComponentFixture<ConditionConstructorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConditionConstructorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConditionConstructorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
