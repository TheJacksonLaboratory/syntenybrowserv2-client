import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeciesSelectionComponent } from './species-selection.component';
import { FormsModule } from '@angular/forms';
import { ClrFormsNextModule } from '@clr/angular';
import { Species } from '../classes/species';
import { By } from '@angular/platform-browser';

const DUAL_SPECIES: Species[] = [ new Species(9606), new Species(10090) ];
const MULTI_SPECIES: Species[] = [ new Species(9606), new Species(10090), new Species(0) ];

describe('SpeciesSelectionComponent', () => {
  let component: SpeciesSelectionComponent;
  let fixture: ComponentFixture<SpeciesSelectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpeciesSelectionComponent ],
      imports: [ FormsModule, ClrFormsNextModule ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpeciesSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();

    expect(component.species).toBeFalsy();
    expect(component.refSpecies).toBeFalsy();
    expect(component.compSpecies).toBeFalsy();
  });

  describe('Dual Species Selection', () => {
    it('should create reference and comparison species for only two species total', () => {
      component.setSpecies(DUAL_SPECIES);

      expect(component.refSpecies).toEqual('9606');
      expect(component.getReferenceSelection()).toEqual(DUAL_SPECIES[0]);

      expect(component.compSpecies).toEqual('10090');
      expect(component.getComparisonSelection()).toEqual(DUAL_SPECIES[1]);
    });

    it('should select first reference and non-reference comparison with reference disabled in comparison', () => {
      component.setSpecies(DUAL_SPECIES);

      fixture.detectChanges();
      // wait until select elements stabilize (i.e. pick up their selection values)
      fixture.whenStable().then(() => {
        // test that first option is selected as reference by default
        let refSelect = fixture.debugElement.query(By.css('#ref')).nativeElement;
        expect(refSelect.value).toBe('9606');

        // test reference options are in the correct order and all are enabled
        let refOptions = fixture.debugElement.queryAll(By.css('#ref option'));
        expect(refOptions.length).toBe(2);
        expect(refOptions[0].nativeElement.value).toBe('9606');
        expect(refOptions[0].nativeElement.disabled).toBeFalsy();
        expect(refOptions[1].nativeElement.value).toBe('10090');
        expect(refOptions[1].nativeElement.disabled).toBeFalsy();

        // test that second option is selected as comparison by default
        let compSelect = fixture.debugElement.query(By.css('#comp')).nativeElement;
        expect(compSelect.value).toBe('10090');

        // test comparison options are in the correct order and species selected as reference is disabled
        let compOptions = fixture.debugElement.queryAll(By.css('#comp option'));
        expect(compOptions.length).toBe(2);
        expect(compOptions[0].nativeElement.value).toBe('9606');
        expect(compOptions[0].nativeElement.disabled).toBeTruthy();
        expect(compOptions[1].nativeElement.value).toBe('10090');
        expect(compOptions[1].nativeElement.disabled).toBeFalsy();
      });
    });

    it('should select the non-reference species for comparison when reference is changed', () => {
      component.setSpecies(DUAL_SPECIES);

      fixture.detectChanges();

      // wait until select elements stabilize (i.e. pick up their selection values)
      fixture.whenStable().then(() => {
        let refSelect = fixture.debugElement.query(By.css('#ref'));

        // simulate a change to the selected reference species
        component.refSpecies = component.species[1].getID();
        component.changeComparison();

        fixture.detectChanges();

        // wait until selects have stabilized again
        fixture.whenStable().then(() => {
          // test that selected value has been changed
          expect(refSelect.nativeElement.value).toBe('10090');

          // test that comparison has been updated accordingly
          let compSelect = fixture.debugElement.query(By.css('#comp')).nativeElement;
          expect(compSelect.value).toBe('9606');

          // test comparison options remain in the same order and new reference
          // species is disabled and the old reference is now enabled and selected
          let compOptions = fixture.debugElement.queryAll(By.css('#comp option'));
          expect(compOptions.length).toBe(2);
          expect(compOptions[0].nativeElement.value).toBe('9606');
          expect(compOptions[0].nativeElement.disabled).toBeFalsy();
          expect(compOptions[1].nativeElement.value).toBe('10090');
          expect(compOptions[1].nativeElement.disabled).toBeTruthy();

          expect(component.refSpecies).toEqual('10090');
          expect(component.getReferenceSelection()).toEqual(MULTI_SPECIES[1]);

          expect(component.compSpecies).toEqual('9606');
          expect(component.getComparisonSelection()).toEqual(MULTI_SPECIES[0]);
        });
      });
    });
  });

  describe('Multiple Species Selection', () => {
    it('should create reference and comparison species for more than two species', () => {
      component.setSpecies(MULTI_SPECIES);

      expect(component.species.length).toEqual(3);
      expect(component.species[2].getID()).toBe('0');

      expect(component.refSpecies).toEqual('9606');
      expect(component.getReferenceSelection()).toEqual(MULTI_SPECIES[0]);

      expect(component.compSpecies).toEqual('10090');
      expect(component.getComparisonSelection()).toEqual(MULTI_SPECIES[1]);
    });

    it('should select first reference and second comparison with reference disabled in comparison', () => {
      component.setSpecies(MULTI_SPECIES);

      fixture.detectChanges();
      // wait until select elements stabilize (i.e. pick up their selection values)
      fixture.whenStable().then(() => {
        // test that first option is selected as reference by default
        let refSelect = fixture.debugElement.query(By.css('#ref')).nativeElement;
        expect(refSelect.value).toBe('9606');

        // test reference options are in the correct order and all are enabled
        let refOptions = fixture.debugElement.queryAll(By.css('#ref option'));
        expect(refOptions.length).toBe(3);
        expect(refOptions[0].nativeElement.value).toBe('9606');
        expect(refOptions[0].nativeElement.disabled).toBeFalsy();
        expect(refOptions[1].nativeElement.value).toBe('10090');
        expect(refOptions[1].nativeElement.disabled).toBeFalsy();
        expect(refOptions[2].nativeElement.value).toBe('0');
        expect(refOptions[2].nativeElement.disabled).toBeFalsy();

        // test that second option is selected as comparison by default
        let compSelect = fixture.debugElement.query(By.css('#comp')).nativeElement;
        expect(compSelect.value).toBe('10090');

        // test comparison options are in the correct order and species selected as reference is disabled
        let compOptions = fixture.debugElement.queryAll(By.css('#comp option'));
        expect(compOptions.length).toBe(3);
        expect(compOptions[0].nativeElement.value).toBe('9606');
        expect(compOptions[0].nativeElement.disabled).toBeTruthy();
        expect(compOptions[1].nativeElement.value).toBe('10090');
        expect(compOptions[1].nativeElement.disabled).toBeFalsy();
        expect(compOptions[2].nativeElement.value).toBe('0');
        expect(compOptions[2].nativeElement.disabled).toBeFalsy();
      });
    });

    it('should change comparison to first non-reference species if reference is changed to current comparison', () => {
      component.setSpecies(MULTI_SPECIES);

      fixture.detectChanges();

      // wait until select elements stabilize (i.e. pick up their selection values)
      fixture.whenStable().then(() => {
        let refSelect = fixture.debugElement.query(By.css('#ref'));

        // simulate a change to the selected reference species
        component.refSpecies = component.species[1].getID();
        component.changeComparison();

        fixture.detectChanges();

        // wait until selects have stabilized again
        fixture.whenStable().then(() => {
          // test that selected value has been changed
          expect(refSelect.nativeElement.value).toBe('10090');

          // test that comparison has been updated accordingly
          let compSelect = fixture.debugElement.query(By.css('#comp')).nativeElement;
          expect(compSelect.value).toBe('9606');

          // test comparison options remain in the same order and new reference
          // species is disabled and the old reference is now enabled and selected
          let compOptions = fixture.debugElement.queryAll(By.css('#comp option'));
          expect(compOptions.length).toBe(3);
          expect(compOptions[0].nativeElement.value).toBe('9606');
          expect(compOptions[0].nativeElement.disabled).toBeFalsy();
          expect(compOptions[1].nativeElement.value).toBe('10090');
          expect(compOptions[1].nativeElement.disabled).toBeTruthy();
          expect(compOptions[2].nativeElement.value).toBe('0');
          expect(compOptions[2].nativeElement.disabled).toBeFalsy();
        });
      });
    });

    it('should not change comparison if reference is changed to non-current comparison', () => {
      component.setSpecies(MULTI_SPECIES);

      fixture.detectChanges();

      // wait until select elements stabilize (i.e. pick up their selection values)
      fixture.whenStable().then(() => {
        let refSelect = fixture.debugElement.query(By.css('#ref'));

        // simulate a change to the selected reference species
        component.refSpecies = component.species[2].getID();
        component.changeComparison();

        fixture.detectChanges();

        // wait until selects have stabilized again
        fixture.whenStable().then(() => {
          // test that selected reference value has been changed
          expect(refSelect.nativeElement.value).toBe('0');

          // test that comparison hasn't been changed
          let compSelect = fixture.debugElement.query(By.css('#comp')).nativeElement;
          expect(compSelect.value).toBe('10090');

          // test comparison options remain in the same order and new reference
          // species is disabled and the old reference is now enabled
          let compOptions = fixture.debugElement.queryAll(By.css('#comp option'));
          expect(compOptions[0].nativeElement.value).toBe('9606');
          expect(compOptions[0].nativeElement.disabled).toBeFalsy();
          expect(compOptions[1].nativeElement.value).toBe('10090');
          expect(compOptions[1].nativeElement.disabled).toBeFalsy();
          expect(compOptions[2].nativeElement.value).toBe('0');
          expect(compOptions[2].nativeElement.disabled).toBeTruthy();
        });
      });
    });
  });
});
