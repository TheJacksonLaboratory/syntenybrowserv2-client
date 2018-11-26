import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {Species} from '../classes/species';

@Component({
  selector: 'app-species-selection',
  templateUrl: './species-selection.component.html',
  styleUrls: ['./species-selection.component.scss']
})
export class SpeciesSelectionComponent implements OnInit {
  species: Array<Species>;
  refSpecies: string;
  compSpecies: string;

  @Output() update: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit() {}

  setSpecies(species): void {
    this.species = species;
    this.refSpecies = this.species[0].getID();
    this.compSpecies = this.species[1].getID();
  }

  changeComparison(): void {
    if(this.refSpecies === this.compSpecies) {
      this.compSpecies = this.species.filter(species => species.getID() !== this.refSpecies)[0].getID();
    }

    this.update.emit()
  }

  getReferenceSelection(): Species {
    return this.species.filter(species => species.getID() === this.refSpecies)[0];
  }

  getComparisonSelection(): Species {
    return this.species.filter(species => species.getID() === this.compSpecies)[0];
  }

}
