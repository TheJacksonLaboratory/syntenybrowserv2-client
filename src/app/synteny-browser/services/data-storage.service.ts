import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Species } from '../classes/species';
import { Filter } from '../classes/filter';
import { Feature } from '../classes/feature';
import { SelectedFeatures } from '../classes/interfaces';
import { SyntenyBlock } from '../classes/synteny-block';

@Injectable({
  providedIn: 'root'
})
export class DataStorageService {
  genomeColorMap: any;
  genomeData: SyntenyBlock[];
  species: Species[];

  refSpecies: Species;
  compSpecies: Species;

  filters: Filter[] = [];
  features: SelectedFeatures;

  ontologyTerms: any = {};

  constructor(private http: ApiService) {
    this.http.getGenomeColorMap().subscribe(map => this.genomeColorMap = map);
  }

  /**
   * Gets the available ontologies for all of the species and for each ontology,
   * retrieves and stores the terms
   */
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

  /**
   * Returns the synteny blocks in the specified list of synteny blocks
   * (genomeData by default) that are in the specified chr
   * @param {string} chr - the chromosome to get block for
   * @param {SyntenyBlock[]} blockList - the list of synteny blocks to search
   */
  getChrBlocks(chr: string, blockList: SyntenyBlock[] = this.genomeData): SyntenyBlock[] {
    return blockList.filter(b => b.matchesRefChr(chr));
  }

  /**
   * Returns the synteny blocks that contain at least one feature
   * @param {Feature[]} features - the features to get synteny blocks for
   */
  getFeatureBlocks(features: Feature[]): SyntenyBlock[] {
    // generate a list of syntenic blocks to highlight; the features.map() is
    // going to produce an array of arrays (some features may span more than one
    // block) which needs to be flattened which is done with the [].concat.apply()
    return [].concat.apply([], features.map(f => this.getBlocksForFeature(f)));
  }

  /**
   * Returns true if the specified feature doesn't exist in a syntenic region
   * @param {Feature} feature - the feature to check
   */
  isFeatureNonSyntenic(feature: Feature): boolean {
    return this.getBlocksForFeature(feature).length === 0;
  }

  /**
   * Returns a list of synteny blocks that a specified feature is located in
   * @param {Feature} feature - the feature to check
   */
  private getBlocksForFeature(feature: Feature): SyntenyBlock[] {
    return this.genomeData.filter(b => b.isAFeatureBlock(feature));
  }

}
