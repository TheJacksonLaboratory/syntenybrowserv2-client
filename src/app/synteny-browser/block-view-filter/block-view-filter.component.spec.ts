/* eslint-disable max-classes-per-file */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarityModule } from '@clr/angular';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Observable, of } from 'rxjs';
import { BlockViewFilterComponent } from './block-view-filter.component';
import { ApiService } from '../services/api.service';
import { Species } from '../classes/species';
import { HUMAN, MOUSE } from '../testing/constants/mock-species';
import { DataStorageService } from '../services/data-storage.service';
import { Feature } from '../classes/feature';
import {
  HYPERGLYCEMIA,
  IMP_GLUC_TOL,
  MOUSE_HUMAN_REF_GENES_CHR_2,
  MOUSE_HUMAN_COMP_GENES_CHR_2,
  TYPE_2_DIAB,
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
    go: [{ id: 'GO:0009232', name: 'thiamine catabolic process', count: null }],
    doid: [
      { id: 'DOID:5614', name: 'eye disease', count: 626 },
      { id: 'DOID:9352', name: 'type 2 diabetes mellitus', count: 3 },
    ],
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

describe('BlockViewFilterComponent', () => {
  let component: BlockViewFilterComponent;
  let fixture: ComponentFixture<BlockViewFilterComponent>;
  const ref: Species = new Species(MOUSE.organism);
  const comp: Species = new Species(HUMAN.organism);

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

  it('should have the correct default values with a fresh editable filter', () => {
    expect(component).toBeTruthy();
    expect(component.refSpecies).toBeTruthy();
    expect(component.compSpecies).toBeTruthy();
    expect(component.filters.length).toBe(1); // creates a new editable filter
    expect(component.filters[0].created).toBe(false);
    expect(component.filters[0].editing).toBe(true);
    expect(component.refGenes.length).toBe(7);
    expect(component.compGenes.length).toBe(6);
    expect(component.activePage).toBe('edit');
    expect(component.currentFilter).toEqual(component.filters[0]);
    expect(component.allGenes.length).toBe(13);
    expect(component.filteredGenes.length).toBe(0);
  });

  it('should be able to create a new default filter', () => {
    expect(component.filters.length).toBe(1);
    expect(component.filters[0].created).toBe(false);
    expect(component.filters[0].editing).toBe(true);
    expect(component.filters[0].advancedFilter).toBe(false);

    component.createNewEditableFilter();

    expect(component.filters.length).toBe(2);
    expect(component.filters[0].created).toBe(false);
    expect(component.filters[0].editing).toBe(false);
    expect(component.filters[0].advancedFilter).toBe(false);
    expect(component.filters[1].created).toBe(false);
    expect(component.filters[1].editing).toBe(true);
    expect(component.filters[1].advancedFilter).toBe(false);
    expect(component.currentFilter).toEqual(component.filters[1]);
  });

  it('should be able to create a new advanced filter', () => {
    expect(component.filters.length).toBe(1);
    expect(component.filters[0].created).toBe(false);
    expect(component.filters[0].editing).toBe(true);

    component.createNewEditableFilter(true);

    expect(component.filters.length).toBe(2);
    expect(component.filters[0].advancedFilter).toBe(false);
    expect(component.filters[1].advancedFilter).toBe(true);
    expect(component.currentFilter).toEqual(component.filters[1]);
  });

  it('can finish a complete filter by ontology term', () => {
    component.currentFilter.species.comp.selected = false;
    component.currentFilter.conditions[0].filterBy = 'ont-mp';
    component.currentFilter.conditions[0].value = 'MP:0001559';

    component.finishFilter();

    expect(component.filters.length).toBe(2);
    expect(component.getCreatedFilters()[0].conditions.length).toBe(1);
    expect(component.getCreatedFilters()[0].filterLabel).toBe('MP:0001559 in Mouse only');
  });

  it('filters genes with a single filter', () => {
    component.currentFilter.species.comp.selected = false;
    component.currentFilter.conditions[0].filterBy = 'ont-mp';
    component.currentFilter.conditions[0].value = 'MP:0001559';

    component.finishFilter();

    expect(component.filteredGenes.length).toBe(4);
  });

  it('filters genes with a multiple filters without repeats', () => {
    component.currentFilter.species.comp.selected = false;
    component.currentFilter.conditions[0].filterBy = 'ont-mp';
    component.currentFilter.conditions[0].value = 'MP:0001559';

    component.finishFilter();

    component.currentFilter.species.comp.selected = false;
    component.currentFilter.conditions[0].filterBy = 'ont-mp';
    component.currentFilter.conditions[0].value = 'MP:0005293';

    component.finishFilter();

    // only one new gene is introduced by second filter even though it matches 3
    expect(component.filteredGenes.length).toBe(5);
    // Tgm2 and Ncoa3 should have 2 filters that they matched for
    expect(component.filteredGenes.find(g => g.symbol === 'Tgm2').filters.length).toBe(2);
    expect(component.filteredGenes.find(g => g.symbol === 'Ncoa3').filters.length).toBe(2);
  });

  it('shows error if incomplete filter is attempted to be created', () => {
    component.currentFilter.species.comp.selected = false;
    component.currentFilter.conditions[0].filterBy = 'ont-mp';
    // no filter value is entered

    component.finishFilter();

    expect(component.filters.length).toBe(1);
    expect(component.filterErrorState).toBe('Please fill out all fields');
  });

  it('can go back and edit a created filter', () => {
    // create one filter
    component.currentFilter.species.comp.selected = false;
    component.currentFilter.conditions[0].filterBy = 'ont-mp';
    component.currentFilter.conditions[0].value = 'MP:0001559';

    component.finishFilter();

    // create another filter
    component.currentFilter.species.comp.selected = false;
    component.currentFilter.conditions[0].filterBy = 'ont-mp';
    component.currentFilter.conditions[0].value = 'MP:0005293';

    component.finishFilter();

    expect(component.filters.length).toBe(3);
    expect(component.filters[0].editing).toBe(false);
    expect(component.filters[1].editing).toBe(false);
    expect(component.filters[2].editing).toBe(true);

    // edit the first filter
    component.editFilter(component.filters[0]);

    expect(component.filters.length).toBe(2);
    expect(component.filters[0].editing).toBe(true);
    expect(component.filters[1].editing).toBe(false);
  });

  it('can remove a filter properly', () => {
    // create one filter
    component.currentFilter.species.comp.selected = false;
    component.currentFilter.conditions[0].filterBy = 'ont-mp';
    component.currentFilter.conditions[0].value = 'MP:0001559';

    component.finishFilter();

    // create another filter
    component.currentFilter.species.comp.selected = false;
    component.currentFilter.conditions[0].filterBy = 'ont-mp';
    component.currentFilter.conditions[0].value = 'MP:0005293';

    component.finishFilter();

    expect(component.filters.length).toBe(3);
    expect(component.filters[0].editing).toBe(false);
    expect(component.filters[0].id).toBe(0);
    expect(component.filters[1].editing).toBe(false);
    expect(component.filters[1].id).toBe(1);
    expect(component.filters[2].editing).toBe(true);
    expect(component.filters[2].id).toBe(2);

    // remove the first filter
    component.removeFilter(component.filters[0]);

    expect(component.filters.length).toBe(2);
    expect(component.filters[0].editing).toBe(false);
    expect(component.filters[0].id).toBe(0); // used to be second in the list with id=1
    expect(component.filters[1].editing).toBe(true);
    expect(component.filters[1].id).toBe(1); // used to be third in the list with id=2
  });

  it('sets simple filter with attribute', () => {
    component.simpleFilterByAttribute('type');

    expect(component.currentFilter.conditions[0].filterBy).toBe('type');
    expect(component.currentFilter.conditions[0].value).toBe('type');
    expect(component.currentFilter.conditions[0].isType()).toBe(true);
  });

  it('sets simple filter with ontology term', () => {
    component.currentFilter.species.comp.selected = false;
    component.simpleFilterByOntology('mp');

    expect(component.currentFilter.conditions[0].filterBy).toBe('ont-mp');
    expect(component.currentFilter.conditions[0].qualifier).toBe('equal');
    expect(component.currentFilter.conditions[0].value).toBe(null);
    expect(component.currentFilter.simpleUserInputNeeded).toBe(true);
    expect(component.currentFilter.filterByButtonText).toBe('in Mouse only by mp term ');
  });

  it('sets simple filter by type', () => {
    component.simpleFilterByType('lncRNA gene');

    expect(component.filters[0].conditions[0].value).toBe('lncRNA gene');
    expect(component.filters[0].conditions[0].isType()).toBe(true);
    expect(component.filters.length).toBe(2);
  });

  it('sets simple filter qualifier', () => {
    component.simpleFilterQualifier('like');

    expect(component.currentFilter.conditions[0].qualifier).toBe('like');
    expect(component.currentFilter.simpleUserInputNeeded).toBe(true);

    // the simple title should have a missing word as that word is set by
    // clicking throught he dropdown menu to get to the qualifier select
    expect(component.currentFilter.filterByButtonText).toBe('in either species by  like');
  });

  it('identifies a satisfactory ontology term to select for a filter', () => {
    component.currentFilter.species.comp.selected = false;
    component.currentFilter.conditions[0].filterBy = 'ont-mp';
    component.currentFilter.conditions[0].value = 'MP:0001559';

    component.checkTermChildren();

    expect(component.filterErrorState).toBe('');
    expect(component.currentFilter.filterLabel).toBe('MP:0001559 in Mouse only');
  });

  it('identifies an ontology term that is too broad to select for a filter', () => {
    component.currentFilter.species.comp.selected = false;
    component.currentFilter.conditions[0].filterBy = 'ont-mp';
    component.currentFilter.conditions[0].value = 'MP:0005508';

    component.checkTermChildren();

    expect(component.filterErrorState).toBe('Term too broad');
    expect(component.currentFilter.filterLabel).toBe('');
  });

  it('can correctly change from an invalidly broad term to a valid term', () => {
    component.currentFilter.species.comp.selected = false;
    component.currentFilter.conditions[0].filterBy = 'ont-mp';
    component.currentFilter.conditions[0].value = 'MP:0005508';

    component.checkTermChildren();

    expect(component.filterErrorState).toBe('Term too broad');
    expect(component.currentFilter.filterLabel).toBe('');

    component.currentFilter.conditions[0].value = 'MP:0001559';

    component.checkTermChildren();

    expect(component.filterErrorState).toBe('');
    expect(component.currentFilter.filterLabel).toBe('MP:0001559 in Mouse only');
  });

  it('gets the viable feature types given the filter species', () => {
    expect(component.getFeatureTypes(component.currentFilter)).toEqual([
      'gene',
      'lncRNA gene',
      'protein coding gene',
      'snoRNA',
    ]);

    // filter on ref species only
    component.currentFilter.species.comp.selected = false;

    expect(component.getFeatureTypes(component.currentFilter)).toEqual([
      'lncRNA gene',
      'protein coding gene',
    ]);

    // filter on neither species (invalid via the UI)
    component.currentFilter.species.ref.selected = false;

    expect(component.getFeatureTypes(component.currentFilter)).toEqual([]);

    // filter on comp species only
    component.currentFilter.species.comp.selected = true;

    expect(component.getFeatureTypes(component.currentFilter)).toEqual(['gene', 'snoRNA']);
  });

  it('unsets condition value if species selections change that negate condition value', () => {
    component.currentFilter.species.comp.selected = false;
    component.currentFilter.conditions[0].filterBy = 'type';
    component.currentFilter.conditions[0].value = 'snoRNA';

    // filter on ref species only
    component.currentFilter.species.comp.selected = false;
    component.getFeatureTypes(component.currentFilter);

    // expect that the value has been reset
    expect(component.currentFilter.conditions[0].value).toBe(null);
  });

  it('gets the correct set(s) of genes based on filter species', () => {
    expect(component.getGenesForSpecies(component.currentFilter)).toEqual(component.allGenes);

    // filter on ref species only
    component.currentFilter.species.comp.selected = false;

    expect(component.getGenesForSpecies(component.currentFilter)).toEqual(component.refGenes);

    // filter on neither species (invalid via the UI)
    component.currentFilter.species.ref.selected = false;

    expect(component.getGenesForSpecies(component.currentFilter)).toEqual([]);

    // filter on comp species only
    component.currentFilter.species.comp.selected = true;

    expect(component.getGenesForSpecies(component.currentFilter)).toEqual(component.compGenes);
  });

  it('gets the current filter', () => {
    expect(component.getCurrentFilter()).toEqual(component.filters[0]);

    component.currentFilter.species.comp.selected = false;
    component.currentFilter.conditions[0].filterBy = 'ont-mp';
    component.currentFilter.conditions[0].value = 'MP:0001559';

    component.finishFilter();

    expect(component.getCurrentFilter()).toEqual(component.filters[1]);
  });

  it('gets created filters', () => {
    expect(component.getCreatedFilters()).toEqual([]);

    component.currentFilter.species.comp.selected = false;
    component.currentFilter.conditions[0].filterBy = 'ont-mp';
    component.currentFilter.conditions[0].value = 'MP:0001559';

    component.finishFilter();

    expect(component.getCreatedFilters()).toEqual([component.filters[0]]);
  });
});
