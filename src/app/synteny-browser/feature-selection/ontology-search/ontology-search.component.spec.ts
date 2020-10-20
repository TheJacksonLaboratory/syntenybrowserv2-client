import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OntologySearchComponent } from './ontology-search.component';
import { ClarityModule } from '@clr/angular';
import { RowDetailComponent } from './row-detail.component';
import { ApiService } from '../../services/api.service';
import { MockApiService } from '../../testing/mock-api.service';
import { MOUSE } from '../../testing/constants/mock-species';
import { Species } from '../../classes/species';
import { GO } from '../../testing/constants/ontology-terms';

export class MockDataStorageService {
  ontologyTerms;
}

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

  it('should create with proper tables, columns, and properties', () => {
    expect(component).toBeTruthy();
    expect(component.terms.columns).toEqual(['id', 'name']);
    expect(component.terms.searchableColumns).toEqual(['id', 'name']);
    expect(component.associations.columns).toEqual(['termID', 'term', 'id', 'symbol']);
    expect(component.associations.searchableColumns).toEqual(['term', 'id', 'symbol']);
  });

  it('should create with search filters', () => {
    expect(component.termsSearch).toBe('');
    expect(component.associationsSearch).toBe('');
  });

  it('should load terms properly if data service does not have terms yet', () => {
    component.loadTerms(new Species(MOUSE.organism), 'GO');

    expect(component.refSpecies.getID()).toBe('10090');
    expect(component.terms.rows.length).toBe(3);
    expect(component.terms.filteredRows.length).toBe(3);
    expect(component.isLoading()).toBeFalsy();
  });

  it('should load terms properly if data service has terms', () => {
    component.data.ontologyTerms.GO = GO;
    component.loadTerms(new Species(MOUSE.organism), 'GO');

    expect(component.refSpecies.getID()).toBe('10090');
    expect(component.terms.rows.length).toBe(3);
    expect(component.terms.filteredRows.length).toBe(3);
    expect(component.isLoading()).toBeFalsy();
  });

  it('should load and show associations for a term', () => {
    const spyOnSwitchView = spyOn(component.switchView, 'emit');
    const spyOnUpdate = spyOn(component.update, 'emit');
    component.data.ontologyTerms.GO = GO;
    component.loadTerms(new Species(MOUSE.organism), 'GO');
    component.loadAssociationsForTerm(GO[0]);

    expect(component.currentTerm).toEqual(GO[0]);
    expect(spyOnSwitchView).toHaveBeenCalled();
    expect(component.associations.rows.length).toBe(4);
    expect(component.associations.filteredRows.length).toBe(4);
    expect(component.associations.selections.length).toBe(0);
    expect(spyOnUpdate).not.toHaveBeenCalled();
    expect(component.isLoading()).toBeFalsy();
  });

  it('should load and select associations for a term without showing them', () => {
    const spyOnSwitchView = spyOn(component.switchView, 'emit');
    const spyOnUpdate = spyOn(component.update, 'emit');
    component.data.ontologyTerms.GO = GO;
    component.loadTerms(new Species(MOUSE.organism), 'GO');
    component.loadAssociationsForTerm(GO[0], false);

    expect(component.currentTerm).toBeFalsy();
    expect(spyOnSwitchView).toHaveBeenCalled();
    expect(component.associations.rows.length).toBe(4);
    expect(component.associations.filteredRows.length).toBe(0);
    expect(component.associations.selections.length).toBe(4);
    expect(spyOnUpdate).toHaveBeenCalled();
    expect(component.isLoading()).toBeFalsy();
  });

  it('should not allow user to view or select all associations for term with 200 or more child terms', () => {
    component.data.ontologyTerms.GO = GO;
    component.loadTerms(new Species(MOUSE.organism), 'GO');

    expect(component.getViewAssociationsTitle(GO[2]))
      .toBe('View gene associations with this term [disabled for being too broad]');
    expect(component.getSelectAllAssociationsTitle(GO[2]))
      .toBe('Select all gene associations with this term [disabled for being too broad]');
  });

  it('can end a selection event', () => {
    const spyOnStartDrag = spyOn(component.associations, 'dragStart');
    const spyOnEndDrag = spyOn(component.associations, 'dragEnd');
    const spyOnUpdateEmit = spyOn(component.update, 'emit');

    component.updateAssociationSelections();

    expect(spyOnStartDrag).not.toHaveBeenCalled();
    expect(spyOnEndDrag).toHaveBeenCalled();
    expect(spyOnUpdateEmit).toHaveBeenCalled();
  });

  it('can clear the terms and associations table', () => {
    component.loadTerms(new Species(MOUSE.organism), 'GO');
    component.loadAssociationsForTerm(GO[0]);

    expect(component.terms.rows.length).toBe(3);
    expect(component.associations.rows.length).toBe(4);

    component.clear();

    expect(component.terms.rows.length).toBe(0);
    expect(component.associations.rows.length).toBe(0);
  });

  it('should navigate back from associations to terms', () => {
    const spyOnSwitchView = spyOn(component.switchView, 'emit');
    component.loadTerms(new Species(MOUSE.organism), 'GO');
    component.loadAssociationsForTerm(GO[0]);

    expect(component.currentTerm).toEqual(GO[0]);
    expect(spyOnSwitchView).toHaveBeenCalled();
    expect(component.associations.rows.length).toBe(4);

    component.backToTerms();

    expect(component.currentTerm).toBeFalsy();
    expect(spyOnSwitchView).toHaveBeenCalledTimes(2);
  });
});
