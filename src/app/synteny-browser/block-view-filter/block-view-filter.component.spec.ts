import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockViewFilterComponent } from './block-view-filter.component';

describe('BlockViewFilterComponent', () => {
  let component: BlockViewFilterComponent;
  let fixture: ComponentFixture<BlockViewFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BlockViewFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlockViewFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
