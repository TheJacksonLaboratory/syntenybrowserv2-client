import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import { FeatureSelectionComponent } from './feature-selection.component';
import {FormsModule} from '@angular/forms';
import {ClarityModule, ClrFormsNextModule} from '@clr/angular';
import {Observable, of} from 'rxjs';
import {GeneMetadata} from '../classes/interfaces';
import {ApiService} from '../services/api.service';
import {Species} from '../classes/species';

// dummy DB of genes (we're only going to be checking the gene symbols (and taxon ID) so the
// other fields don't need to be real or even unique in this case)
const GENES = [
  {gene_id: '', gene_symbol: 'Trap1', gene_type: '', chr: '', strand: '', start: 0, end: 0},
  {gene_id: '', gene_symbol: 'Trappc1', gene_type: '', chr: '', strand: '', start: 0, end: 0},
  {gene_id: '', gene_symbol: 'Trap1a', gene_type: '', chr: '', strand: '', start: 0, end: 0},
  {gene_id: '', gene_symbol: 'Trappc6b', gene_type: '', chr: '', strand: '', start: 0, end: 0}
];

class MockApiService {
  getGeneMatches(taxonID: string, search: string): Observable<Array<GeneMetadata>> {
    // return an observable array of matching dummy data
    return of(GENES.filter(gene => gene.gene_symbol.includes(search)));
  }
}

fdescribe('FeatureSelectionComponent', () => {
  let component: FeatureSelectionComponent;
  let fixture: ComponentFixture<FeatureSelectionComponent>;
  let http: ApiService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FeatureSelectionComponent ],
      imports: [ FormsModule, ClrFormsNextModule, ClarityModule ],
      providers: [ {provide: ApiService, useClass: MockApiService} ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeatureSelectionComponent);
    component = fixture.componentInstance;
    http = TestBed.get(ApiService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();

    expect(component.refSpecies).toBeFalsy();
    expect(component.search).toBe('');
    expect(component.searchType).toBeFalsy();
    expect(component.searchPlaceholder).toBeFalsy();
    expect(component.rows.length).toBe(0);
    expect(component.selections.length).toBe(0);
  });

  it('should display a search type and respective search term placeholder and table columns', () => {
    component.load(new Species(10090));

    expect(component.refSpecies).toBeTruthy();
    expect(component.refSpecies.getID()).toBe('10090');
    expect(component.search).toBe('');
    expect(component.searchType.value).toBe('Gene Symbol');
    expect(component.searchPlaceholder).toBe('Symbol (e.g. Trp53)');
    expect(component.rows.length).toBe(0);
    expect(component.selections.length).toBe(0);
    expect(component.getSinglePagePaginatorLabel()).toBe('0 of 0');

    expect(component.displayColumns.length).toBe(7);
    expect(component.displayColumns[0]).toBe('gene_id');
  });

  it('should change search term and table columns when search type is changed to qtl', () => {
    component.load(new Species(10090));

    expect(component.searchType.value).toBe('Gene Symbol');
    expect(component.searchPlaceholder).toBe('Symbol (e.g. Trp53)');

    // simulate change of search type
    component.searchType = component.refSpecies.searchTypes[1];
    component.setTypeDependentElements();

    fixture.detectChanges();

    expect(component.searchType.value).toBe('QTL');
    expect(component.searchPlaceholder).toBe('Symbol (e.g. Tmev)');

    expect(component.displayColumns.length).toBe(5);
    expect(component.displayColumns[0]).toBe('qtl_id');

    component.searchType = component.refSpecies.searchTypes[2];
    component.setTypeDependentElements();

    fixture.detectChanges();

    expect(component.searchType.value).toBe('Gene Ontology (GO)');
    expect(component.searchPlaceholder).toBe('GO term (e.g. BMP signaling pathway)');

    expect(component.displayColumns.length).toBe(9);
    expect(component.displayColumns[0]).toBe('term_id');
  });

  // TODO: TEST RESULTS FOR GENE SYMBOL SEARCH (UPDATE INPUT TWICE)

  // TODO: TEST RESULTS FOR QTL SEARCH

  // TODO: TEST RESULTS FOR ONTOLOGY SEARCH

  // TODO: TEST SEARCHING ONE TYPE WITH SEARCH TERM AND THEN CHANGE TYPE => TABLE AND SEARCH TERM CLEARS

  // TODO: TEST SEARCHING A TERM AND MAKE A SELECTION, SEARCH NEW TYPE/TERM AND SELECT => SELECTIONS FROM BOTH TYPES REMAIN
});
