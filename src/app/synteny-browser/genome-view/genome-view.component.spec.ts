import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GenomeViewComponent } from './genome-view.component';

describe('GenomeViewComponent', () => {
  let component: GenomeViewComponent;
  let fixture: ComponentFixture<GenomeViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [GenomeViewComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GenomeViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
