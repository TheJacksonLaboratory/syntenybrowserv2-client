import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { ClarityModule } from '@clr/angular';
import { Species } from '../classes/species';
import { SpeciesSelectionComponent } from './species-selection.component';
import { HUMAN, MOUSE, RAT } from '../testing/constants/mock-species';

describe('SpeciesSelectionComponent', () => {
  let component: SpeciesSelectionComponent;
  let fixture: ComponentFixture<SpeciesSelectionComponent>;

  let dualSpecies: Species[];
  let multiSpecies: Species[];

  beforeAll(() => {
    dualSpecies = [new Species(HUMAN.organism), new Species(MOUSE.organism)];
    multiSpecies = [
      new Species(HUMAN.organism),
      new Species(MOUSE.organism),
      new Species(RAT.organism),
    ];
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SpeciesSelectionComponent],
      imports: [FormsModule, ClarityModule],
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
      component.setSpecies(dualSpecies);

      expect(component.refSpecies).toEqual('9606');
      expect(component.getReferenceSelection()).toEqual(dualSpecies[0]);

      expect(component.compSpecies).toEqual('10090');
      expect(component.getComparisonSelection()).toEqual(dualSpecies[1]);
    });

    it('should select first reference and non-reference comparison with reference disabled in comparison', () => {
      component.setSpecies(dualSpecies);

      fixture.detectChanges();
      // wait until select elements stabilize (i.e. pick up their selection values)
      fixture.whenStable().then(() => {
        // test that first option is selected as reference by default
        const refSelect = fixture.debugElement.query(By.css('#ref')).nativeElement;
        expect(refSelect.value).toBe('9606');

        // test reference options are in the correct order and all are enabled
        const refOptions = fixture.debugElement.queryAll(By.css('#ref option'));
        expect(refOptions.length).toBe(2);
        expect(refOptions[0].nativeElement.value).toBe('9606');
        expect(refOptions[0].nativeElement.disabled).toBeFalsy();
        expect(refOptions[1].nativeElement.value).toBe('10090');
        expect(refOptions[1].nativeElement.disabled).toBeFalsy();

        // test that second option is selected as comparison by default
        const compSelect = fixture.debugElement.query(By.css('#comp')).nativeElement;
        expect(compSelect.value).toBe('10090');

        // test comp options are in the correct order and species selected as
        // reference is disabled
        const compOptions = fixture.debugElement.queryAll(By.css('#comp option'));
        expect(compOptions.length).toBe(2);
        expect(compOptions[0].nativeElement.value).toBe('9606');
        expect(compOptions[0].nativeElement.disabled).toBeTruthy();
        expect(compOptions[1].nativeElement.value).toBe('10090');
        expect(compOptions[1].nativeElement.disabled).toBeFalsy();
      });
    });

    it('should select the non-reference species for comparison when reference is changed', () => {
      component.setSpecies(dualSpecies);

      fixture.detectChanges();

      // wait until select elements stabilize (i.e. pick up their selection values)
      fixture.whenStable().then(() => {
        const refSelect = fixture.debugElement.query(By.css('#ref'));

        // simulate a change to the selected reference species
        component.refSpecies = component.species[1].getID();
        component.changeComparison();

        fixture.detectChanges();

        // wait until selects have stabilized again
        fixture.whenStable().then(() => {
          // test that selected value has been changed
          expect(refSelect.nativeElement.value).toBe('10090');

          // test that comparison has been updated accordingly
          const compSelect = fixture.debugElement.query(By.css('#comp')).nativeElement;
          expect(compSelect.value).toBe('9606');

          // test comparison options remain in the same order and new reference
          // species is disabled and the old reference is now enabled and selected
          const compOptions = fixture.debugElement.queryAll(By.css('#comp option'));
          expect(compOptions.length).toBe(2);
          expect(compOptions[0].nativeElement.value).toBe('9606');
          expect(compOptions[0].nativeElement.disabled).toBeFalsy();
          expect(compOptions[1].nativeElement.value).toBe('10090');
          expect(compOptions[1].nativeElement.disabled).toBeTruthy();

          expect(component.refSpecies).toEqual('10090');
          expect(component.getReferenceSelection()).toEqual(multiSpecies[1]);

          expect(component.compSpecies).toEqual('9606');
          expect(component.getComparisonSelection()).toEqual(multiSpecies[0]);
        });
      });
    });
  });

  describe('Multiple Species Selection', () => {
    it('should create reference and comparison species for more than two species', () => {
      component.setSpecies(multiSpecies);

      expect(component.species.length).toEqual(3);
      expect(component.species[2].getID()).toBe('10116');

      expect(component.refSpecies).toEqual('9606');
      expect(component.getReferenceSelection()).toEqual(multiSpecies[0]);

      expect(component.compSpecies).toEqual('10090');
      expect(component.getComparisonSelection()).toEqual(multiSpecies[1]);
    });

    it('should select first reference and second comparison with reference disabled in comparison', () => {
      component.setSpecies(multiSpecies);

      fixture.detectChanges();
      // wait until select elements stabilize (i.e. pick up their selection values)
      fixture.whenStable().then(() => {
        // test that first option is selected as reference by default
        const refSelect = fixture.debugElement.query(By.css('#ref')).nativeElement;
        expect(refSelect.value).toBe('9606');

        // test reference options are in the correct order and all are enabled
        const refOptions = fixture.debugElement.queryAll(By.css('#ref option'));
        expect(refOptions.length).toBe(3);
        expect(refOptions[0].nativeElement.value).toBe('9606');
        expect(refOptions[0].nativeElement.disabled).toBeFalsy();
        expect(refOptions[1].nativeElement.value).toBe('10090');
        expect(refOptions[1].nativeElement.disabled).toBeFalsy();
        expect(refOptions[2].nativeElement.value).toBe('10116');
        expect(refOptions[2].nativeElement.disabled).toBeFalsy();

        // test that second option is selected as comparison by default
        const compSelect = fixture.debugElement.query(By.css('#comp')).nativeElement;
        expect(compSelect.value).toBe('10090');

        // test comparison options are in the correct order and species
        // selected as reference is disabled
        const compOptions = fixture.debugElement.queryAll(By.css('#comp option'));
        expect(compOptions.length).toBe(3);
        expect(compOptions[0].nativeElement.value).toBe('9606');
        expect(compOptions[0].nativeElement.disabled).toBeTruthy();
        expect(compOptions[1].nativeElement.value).toBe('10090');
        expect(compOptions[1].nativeElement.disabled).toBeFalsy();
        expect(compOptions[2].nativeElement.value).toBe('10116');
        expect(compOptions[2].nativeElement.disabled).toBeFalsy();
      });
    });

    it('should change comparison to first non-reference species if reference is changed to current comparison', () => {
      component.setSpecies(multiSpecies);

      fixture.detectChanges();

      // wait until select elements stabilize (i.e. pick up their selection values)
      fixture.whenStable().then(() => {
        const refSelect = fixture.debugElement.query(By.css('#ref'));

        // simulate a change to the selected reference species
        component.refSpecies = component.species[1].getID();
        component.changeComparison();

        fixture.detectChanges();

        // wait until selects have stabilized again
        fixture.whenStable().then(() => {
          // test that selected value has been changed
          expect(refSelect.nativeElement.value).toBe('10090');

          // test that comparison has been updated accordingly
          const compSelect = fixture.debugElement.query(By.css('#comp')).nativeElement;
          expect(compSelect.value).toBe('9606');

          // test comparison options remain in the same order and new reference
          // species is disabled and the old reference is now enabled and selected
          const compOptions = fixture.debugElement.queryAll(By.css('#comp option'));
          expect(compOptions.length).toBe(3);
          expect(compOptions[0].nativeElement.value).toBe('9606');
          expect(compOptions[0].nativeElement.disabled).toBeFalsy();
          expect(compOptions[1].nativeElement.value).toBe('10090');
          expect(compOptions[1].nativeElement.disabled).toBeTruthy();
          expect(compOptions[2].nativeElement.value).toBe('10116');
          expect(compOptions[2].nativeElement.disabled).toBeFalsy();
        });
      });
    });

    it('should not change comparison if reference is changed to non-current comparison', () => {
      component.setSpecies(multiSpecies);

      fixture.detectChanges();

      // wait until select elements stabilize (i.e. pick up their selection values)
      fixture.whenStable().then(() => {
        const refSelect = fixture.debugElement.query(By.css('#ref'));

        // simulate a change to the selected reference species
        component.refSpecies = component.species[2].getID();
        component.changeComparison();

        fixture.detectChanges();

        // wait until selects have stabilized again
        fixture.whenStable().then(() => {
          // test that selected reference value has been changed
          expect(refSelect.nativeElement.value).toBe('10116');

          // test that comparison hasn't been changed
          const compSelect = fixture.debugElement.query(By.css('#comp')).nativeElement;
          expect(compSelect.value).toBe('10090');

          // test comparison options remain in the same order and new reference
          // species is disabled and the old reference is now enabled
          const compOptions = fixture.debugElement.queryAll(By.css('#comp option'));
          expect(compOptions[0].nativeElement.value).toBe('9606');
          expect(compOptions[0].nativeElement.disabled).toBeFalsy();
          expect(compOptions[1].nativeElement.value).toBe('10090');
          expect(compOptions[1].nativeElement.disabled).toBeFalsy();
          expect(compOptions[2].nativeElement.value).toBe('10116');
          expect(compOptions[2].nativeElement.disabled).toBeTruthy();
        });
      });
    });
  });
});
