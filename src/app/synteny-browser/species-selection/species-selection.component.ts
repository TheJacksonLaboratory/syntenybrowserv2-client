import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Species } from '../classes/species';
import { DataStorageService } from '../services/data-storage.service';

@Component({
  selector: 'species-selection',
  templateUrl: './species-selection.component.html'
})
export class SpeciesSelectionComponent {
  species: Species[];
  refSpecies: string;
  compSpecies: string;

  @Output() update: EventEmitter<any> = new EventEmitter();

  constructor(private data: DataStorageService) { }


  // Operational Methods

  /**
   * Sets the reference and comparison species to the the first and
   * second species available, respectively
   */
  getSpecies(): void {
    this.species = this.data.species;
    this.refSpecies = this.species[0].getID();
    this.compSpecies = this.species[1].getID();
  }

  /**
   * Changes the comparison species to the first non-reference species available
   */
  changeComparison(): void {
    if(this.refSpecies === this.compSpecies) {
      this.compSpecies = this.species.filter(s => !this.isReference(s))[0].getID();
    }

    this.update.emit()
  }


  // Getter Methods

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

  private isComparison(species: Species): boolean {
    return species.getID() === this.compSpecies;
  }

  private isReference(species: Species): boolean {
    return species.getID() === this.refSpecies;
  }

}
