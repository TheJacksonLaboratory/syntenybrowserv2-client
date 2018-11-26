import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockViewBrowserComponent } from './block-view-browser.component';

describe('BlockViewBrowserComponent', () => {
  let component: BlockViewBrowserComponent;
  let fixture: ComponentFixture<BlockViewBrowserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BlockViewBrowserComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlockViewBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
