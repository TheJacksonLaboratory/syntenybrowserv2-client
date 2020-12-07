import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockViewFilterComponent } from './block-view-filter.component';
import { ClarityModule } from '@clr/angular';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ApiService } from '../services/api.service';
import { Species } from '../classes/species';
import { HUMAN, MOUSE } from '../testing/constants/mock-species';
import { DataStorageService } from '../services/data-storage.service';
import { Observable, of } from 'rxjs';
import { Feature } from '../classes/feature';
import {
  HYPERGLYCEMIA,
  IMP_GLUC_TOL,
  MOUSE_HUMAN_REF_GENES_CHR_2,
  MOUSE_HUMAN_COMP_GENES_CHR_2,
  TYPE_2_DIAB
} from '../testing/constants/filtering-features';
import { Gene } from '../classes/gene';

class MockDataStorageService {
  ontologyTerms = {
    mp: [
      { id: 'MP:0001559', name: 'hyperglycemia', count: null },
      { id: 'MP:0005293', name: 'impaired glucose tolerance', count: null },
      { id: 'MP:0005291', name: 'abnormal glucose tolerance', count: 2 },
      { id: 'MP:0005508', name: 'abnormal skeleton morphology', count: 698 },
    ],
    go: [
      { id: 'GO:0009232', name: 'thiamine catabolic process', count: null },
    ],
    doid: [
      { id: 'DOID:5614', name: 'eye disease', count: 626 },
      { id: 'DOID:9352', name: 'type 2 diabetes mellitus', count: 3 },
    ]
  };
}

class FilteringMockApiService {
  getTermAssociations(taxonID: string, termID: string): Observable<Feature[]> {
    let assoc;
    if (termID === 'MP:0001559') {
      assoc = HYPERGLYCEMIA;
    } else if (termID === 'MP:0005293') {
      assoc = IMP_GLUC_TOL;
    } else if (termID === 'DOID:9352') {
      assoc = TYPE_2_DIAB;
    } else {
      assoc = [];
    }
    return of(assoc.map(a => new Feature(a, true)));
  }
}

fdescribe('BlockViewFilterComponent', () => {
  let component: BlockViewFilterComponent;
  let fixture: ComponentFixture<BlockViewFilterComponent>;
  let ref: Species = new Species(MOUSE.organism);
  let comp: Species = new Species(HUMAN.organism);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ClarityModule, FormsModule, NgSelectModule],
      declarations: [BlockViewFilterComponent],
      providers: [
        { provide: ApiService, useClass: FilteringMockApiService },
        { provide: DataStorageService, useClass: MockDataStorageService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlockViewFilterComponent);
    component = fixture.componentInstance;
    component.refGenes = MOUSE_HUMAN_REF_GENES_CHR_2.map(g => new Gene(g, 100, 10090));
    component.compGenes = MOUSE_HUMAN_COMP_GENES_CHR_2.map(g => new Gene(g, 100, 10090));
    component.filters = [];
    component.refSpecies = ref;
    component.compSpecies = comp;
    fixture.detectChanges();
  });

  it('should have the correct default values', () => {
    expect(component).toBeTruthy();
    expect(component.refSpecies).toBeTruthy();
    expect(component.compSpecies).toBeTruthy();
    expect(component.filters.length).toBe(1); // new editable filter
    expect(component.filters[0].created).toBe(false);
    expect(component.filters[0].editing).toBe(true);
    expect(component.refGenes.length).toBe(7);
    expect(component.compGenes.length).toBe(6);
    expect(component.activePage).toBe('edit');
    expect(component.currentFilter).toEqual(component.filters[0]);
    expect(component.allGenes.length).toBe(13);
    expect(component.filteredGenes.length).toBe(0);
  });
});
