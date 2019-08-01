import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Species } from '../classes/species';

@Component({
  selector: 'app-species-selection',
  templateUrl: './species-selection.component.html'
})
export class SpeciesSelectionComponent {
  species: Species[];
  refSpecies: string;
  compSpecies: string;

  @Output() update: EventEmitter<any> = new EventEmitter();

  constructor() { }


  // Operational Methods

  /**
   * Sets the reference and comparison species to the the first and
   * second species available, respectively
   * @param {Species[]} species - list of available species to compare
   */
  setSpecies(species: Species[]): void {
    this.species = species;
    this.refSpecies = this.species[0].getID();
    this.compSpecies = this.species[1].getID();
  }

  /**
   * Changes the comparison species to the first non-reference species available
   */
  changeComparison(): void {
    if(this.refSpecies === this.compSpecies) {
      this.compSpecies = this.species.filter(s => {
                                       return s.getID() !== this.refSpecies
                                     })[0].getID();
    }

    this.update.emit()
  }


  // Getter Methods

  /**
   * Returns the current reference species
   */
  getReferenceSelection(): Species {
    return this.species.filter(s => s.getID() === this.refSpecies)[0];
  }

  /**
   * Returns the current comparison species
   */
  getComparisonSelection(): Species {
    return this.species.filter(s => s.getID() === this.compSpecies)[0];
  }

}
