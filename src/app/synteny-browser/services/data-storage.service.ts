import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Species } from '../classes/species';
import { Filter } from '../classes/filter';
import { Feature } from '../classes/feature';
import { SelectedFeatures } from '../classes/interfaces';
import { SyntenyBlock } from '../classes/synteny-block';

@Injectable({
  providedIn: 'root',
})
export class DataStorageService {
  // lookup object mapping chromosome values to their associated color
  genomeColorMap: any;

  // list of genome-wide synteny for the reference species
  genomeData: SyntenyBlock[];

  // all of the species available to be reference or comparison
  species: Species[];

  // currently selected reference species
  refSpecies: Species;

  // currently selected comparison species
  compSpecies: Species;

  // list of all current active filters
  filters: Filter[] = [];

  // data on all selected features to see in the block view browser
  features: SelectedFeatures;

  // ontology terms gathered for all available ontologies
  ontologyTerms: any = {};

  constructor(private http: ApiService) {
    this.http.getGenomeColorMap().subscribe(map => {
      this.genomeColorMap = map;
    });
  }

  /**
   * Retrieves the available ontologies for all of the species and for each
   * ontology, retrieves and stores the terms
   */
  retrieveOntologyTerms(): void {
    const onts = Array.from(
      new Set(
        this.refSpecies.onts.map(o => o.value).concat(...this.compSpecies.onts.map(o => o.value)),
      ),
    );

    onts.forEach(o => {
      this.http.getTermsForAutocomplete(o).subscribe(terms => {
        this.ontologyTerms[o] = terms;
      });
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
    // generate a list of syntenic blocks to highlight; the features.map() is going
    // to produce an array of arrays (some features may span more than one block)
    // which needs to be flattened which is done with the spread operator ('...')
    return [].concat(...features.map(f => this.getBlocksForFeature(f)));
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
