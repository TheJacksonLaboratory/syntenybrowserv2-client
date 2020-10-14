import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockViewBrowserComponent } from './block-view-browser.component';
import { ClarityModule } from '@clr/angular';
import { FormsModule } from '@angular/forms';
import { QuickNavigationComponent } from './quick-navigation/quick-navigation.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ApiService } from '../services/api.service';
import { MockApiService } from '../testing/mock-api.service';

describe('BlockViewBrowserComponent', () => {
  let component: BlockViewBrowserComponent;
  let fixture: ComponentFixture<BlockViewBrowserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ClarityModule, FormsModule, NgSelectModule],
      declarations: [BlockViewBrowserComponent, QuickNavigationComponent],
      providers: [
        { provide: ApiService, useClass: MockApiService }
      ],
    }).compileComponents();
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
