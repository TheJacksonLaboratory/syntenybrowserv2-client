import { Component, EventEmitter, Output } from '@angular/core';
import { Species } from '../classes/species';

@Component({
  selector: 'species-selection',
  templateUrl: './species-selection.component.html',
})
export class SpeciesSelectionComponent {
  // all of the species available to be reference or comparison
  species: Species[];

  // currently selected reference species
  refSpecies: string;

  // currently selected comparison species
  compSpecies: string;

  // emits when the user changes the selected reference or comparison species
  @Output() update: EventEmitter<any> = new EventEmitter();

  /**
   * Sets the reference and comparison species to the the first and second
   * species available, respectively
   * @param {Species[]} species - the list of available species
   */
  setSpecies(species: Species[]): void {
    this.species = species;
    this.refSpecies = species[0].getID();
    this.compSpecies = species[1].getID();
  }

  /**
   * Changes the reference species to the first non-comparison species
   * available if the comparison species is the same as the reference
   */
  changeReference(): void {
    if (this.refSpecies === this.compSpecies) {
      this.refSpecies = this.species.filter(s => !this.isComparison(s))[0].getID();
    }

    this.update.emit();
  }

  /**
   * Changes the comparison species to the first non-reference species
   * available if the reference species is the same as the comparison
   */
  changeComparison(): void {
    if (this.refSpecies === this.compSpecies) {
      this.compSpecies = this.species.filter(s => !this.isReference(s))[0].getID();
    }

    this.update.emit();
  }

  /**
   * Returns the current reference species
   */
  getReferenceSelection(): Species {
    return this.species.filter(s => this.isReference(s))[0];
  }

  /**
   * Returns the current comparison species
   */
  getComparisonSelection(): Species {
    return this.species.filter(s => this.isComparison(s))[0];
  }

  /**
   * Returns true if the specified species is the comparison species
   * @param {Species} species - species to check against the comp species value
   */
  private isComparison(species: Species): boolean {
    return species.getID() === this.compSpecies;
  }

  /**
   * Returns true if the specified species is the reference species
   * @param {Species} species - species to check against the ref species value
   */
  private isReference(species: Species): boolean {
    return species.getID() === this.refSpecies;
  }
}
