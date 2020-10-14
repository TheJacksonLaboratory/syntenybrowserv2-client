import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureSearchComponent } from './feature-search.component';
import { ClarityModule } from '@clr/angular';
import { ApiService } from '../../services/api.service';
import { MockApiService } from '../../testing/mock-api.service';

describe('FeatureSearchComponent', () => {
  let component: FeatureSearchComponent;
  let fixture: ComponentFixture<FeatureSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ClarityModule],
      declarations: [FeatureSearchComponent],
      providers: [
        { provide: ApiService, useClass: MockApiService }
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeatureSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
