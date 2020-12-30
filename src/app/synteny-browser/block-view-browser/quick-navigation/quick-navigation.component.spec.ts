import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarityModule } from '@clr/angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import * as d3 from 'd3';
import { QuickNavigationComponent } from './quick-navigation.component';
import { BrowserInterval } from '../../classes/browser-interval';
import { MOUSE_TO_HUMAN_SYNTENY } from '../../testing/constants/genome-synteny';
import { SyntenyBlock } from '../../classes/synteny-block';

describe('QuickNavigationComponent', () => {
  let component: QuickNavigationComponent;
  let fixture: ComponentFixture<QuickNavigationComponent>;
  const scale = d3
    .scaleLinear()
    .domain([0, 282763074])
    .range([0, 1200]);
  const interval: BrowserInterval = new BrowserInterval(
    '1',
    282763074,
    MOUSE_TO_HUMAN_SYNTENY.filter(b => b.ref_chr === '1').map(b => new SyntenyBlock(b, true)),
    scale,
    true,
  );

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ClarityModule, NgSelectModule, FormsModule],
      declarations: [QuickNavigationComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuickNavigationComponent);
    component = fixture.componentInstance;
    component.interval = interval;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
