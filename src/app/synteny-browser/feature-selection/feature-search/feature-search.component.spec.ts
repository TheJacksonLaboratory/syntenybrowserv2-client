import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureSearchComponent } from './feature-search.component';
import { ClarityModule } from '@clr/angular';
import { ApiService } from '../../services/api.service';
import { MockApiService } from '../../testing/mock-api.service';
import { HUMAN, MOUSE } from '../../testing/constants/mock-species';
import { Species } from '../../classes/species';

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

  it('should create with proper table columns and properties', () => {
    expect(component).toBeTruthy();
    expect(component.features).toBeTruthy();
    expect(component.features.columns).toEqual(['id', 'symbol', 'chr', 'start', 'end', 'type']);
    expect(component.features.searchableColumns).toEqual(['id', 'symbol', 'type']);
  });

  it('should create with empty feature search filter', () => {
    expect(component.featuresSearch).toBe('');
  });

  it('should create with no reference species, by default', () => {
    expect(component.refSpecies).toBeFalsy();
  });

  it('should load features properly when reference species has QTLs', () => {
    component.loadFeatures(new Species(MOUSE.organism));

    expect(component.refSpecies.getID()).toBe('10090');
    expect(component.features.rows.length).toBe(8);
    expect(component.features.filteredRows.length).toBe(8);
    expect(component.isLoading()).toBeFalsy();
  });

  it('should load features properly when reference species has no QTLs', () => {
    const spyOnClear = spyOn(component, 'clear');
    component.loadFeatures(new Species(HUMAN.organism));

    expect(spyOnClear).toHaveBeenCalled();
    expect(component.refSpecies.getID()).toBe('9606');
    expect(component.features.rows.length).toBe(5);
    expect(component.features.filteredRows.length).toBe(5);
    expect(component.isLoading()).toBeFalsy();
  });

  it('ignores loading again if the reference species is the same as current', () => {
    const species = new Species(HUMAN.organism)
    const spyOnClear = spyOn(component, 'clear');
    component.loadFeatures(species);

    expect(component.refSpecies.getID()).toBe('9606');

    component.loadFeatures(species);

    expect(spyOnClear).toHaveBeenCalledTimes(1); // only for the first load
  });

  it('can end a selection event', () => {
    const spyOnStartDrag = spyOn(component.features, 'dragStart');
    const spyOnEndDrag = spyOn(component.features, 'dragEnd');
    const spyOnUpdateEmit = spyOn(component.update, 'emit');

    component.updateFeatureSelections();

    expect(spyOnStartDrag).not.toHaveBeenCalled();
    expect(spyOnEndDrag).toHaveBeenCalled();
    expect(spyOnUpdateEmit).toHaveBeenCalled();
  });

  it('can clear the feature table', () => {
    component.loadFeatures(new Species(HUMAN.organism));

    expect(component.features.rows.length).toBe(5);

    component.clear();

    expect(component.features.rows.length).toBe(0);
  });
});
