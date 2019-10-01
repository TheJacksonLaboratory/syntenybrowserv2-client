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

  constructor(private http: ApiService) {
    this.http.getGenomeColorMap().subscribe(map => this.genomeColorMap = map);
    this.http.getSpecies().subscribe(species => this.species = species);
  }
}
