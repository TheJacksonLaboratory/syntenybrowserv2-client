import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarityModule } from '@clr/angular';
import { FormsModule } from '@angular/forms';
import { FeatureSelectionComponent } from './feature-selection.component';
import { OntologySearchComponent } from './ontology-search/ontology-search.component';
import { FeatureSearchComponent } from './feature-search/feature-search.component';
import { RowDetailComponent } from './ontology-search/row-detail.component';
import { ApiService } from '../services/api.service';
import { MockApiService } from '../testing/mock-api.service';

describe('FeatureSelectionComponent', () => {
  let component: FeatureSelectionComponent;
  let fixture: ComponentFixture<FeatureSelectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ClarityModule, FormsModule],
      declarations: [
        FeatureSelectionComponent,
        OntologySearchComponent,
        FeatureSearchComponent,
        RowDetailComponent,
      ],
      providers: [{ provide: ApiService, useClass: MockApiService }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeatureSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
