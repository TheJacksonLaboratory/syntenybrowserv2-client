import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OntologySearchComponent } from './ontology-search.component';
import { ClarityModule } from '@clr/angular';
import { RowDetailComponent } from './row-detail.component';
import { ApiService } from '../../services/api.service';
import { MockApiService } from '../../testing/mock-api.service';

describe('OntologySearchComponent', () => {
  let component: OntologySearchComponent;
  let fixture: ComponentFixture<OntologySearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ClarityModule],
      declarations: [OntologySearchComponent, RowDetailComponent],
      providers: [
        { provide: ApiService, useClass: MockApiService }
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OntologySearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
