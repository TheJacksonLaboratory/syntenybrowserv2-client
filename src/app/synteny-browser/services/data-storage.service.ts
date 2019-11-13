import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Species } from '../classes/species';
import { Filter } from '../classes/filter';
import { Feature } from '../classes/feature';
import { SelectedFeatures } from '../classes/interfaces';

@Injectable({
  providedIn: 'root'
})
export class DataStorageService {
  genomeColorMap: any;
  species: Species[];

  refSpecies: Species;
  compSpecies: Species;

  filters: Filter[] = [];
  features: SelectedFeatures;

  ontologyTerms: any = {};

  constructor(private http: ApiService) {
    this.http.getSpecies().subscribe(species => {
      this.species = species;

      this.http.getGenomeColorMap().subscribe(map => {
        this.genomeColorMap = map;
      });
    });
  }

  getOntologyTerms() {
    let onts = Array.from(new Set(
      this.refSpecies.onts.map(o => o.value)
        .concat(...this.compSpecies.onts.map(o => o.value))
    ));

    onts.forEach(o => {
      this.http.getTermsForAutocomplete(o)
        .subscribe(terms => this.ontologyTerms[o] = terms);
    });
  }
}
