import { Component, EventEmitter, Output } from '@angular/core';
import { Species } from '../../classes/species';
import { ApiService } from '../../services/api.service';
import { TableData } from '../../classes/table-data';
import { Feature } from '../../classes/feature';

@Component({
  selector: 'feature-search',
  templateUrl: './feature-search.component.html',
  styleUrls: ['./feature-search.component.scss'],
})
export class FeatureSearchComponent {
  // currently selected reference species
  refSpecies: Species;

  // table data containing all of the features to display in the datagrid
  features: TableData<Feature>;

  // current search string that filters the datagrid
  featuresSearch = '';

  // emits whenever (de)selections are made in the table
  @Output() update: EventEmitter<any> = new EventEmitter();

  constructor(private http: ApiService) {
    this.features = new TableData(
      ['id', 'symbol', 'chr', 'start', 'end', 'type'],
      ['id', 'symbol', 'type'],
    );
  }

  /**
   * Sets the reference species, retrieves the terms or the specified reference
   * species and ontology and sets the table rows with the results, sorted by
   * gene symbol
   * @param {Species} refSpecies - the current reference species
   */
  loadFeatures(refSpecies: Species): void {
    // only get the gene (and QTL) data if changes have been made to what the
    // user wants to see; otherwise it's just another 6-7 wasted seconds
    // if (this.refSpecies !== refSpecies || !this.features.rows.length) {
    //   this.clear();
    //   this.features.loading = true;
    //
    //   this.refSpecies = refSpecies;
    //
    //   // get genes by chromosome
    //   let returnedChrs = 0;
    //   this.refSpecies.getChromosomes().forEach(chr => {
    //     this.http.getGeneMetadata(refSpecies.getID(), chr).subscribe((genes: Feature[]) => {
    //       this.features.setRows(genes);
    //       returnedChrs += 1;
    //
    //       if (returnedChrs === this.refSpecies.getNumChrs()) {
    //         this.features.loading = false;
    //       }
    //     });
    //   });
    //
    //   // get QTLs if the reference species has them
    //   if (this.refSpecies.hasQTLs) {
    //     this.http.getQTLs(this.refSpecies.getID()).subscribe(qtls => {
    //       this.features.setRows(qtls);
    //     });
    //   }
    // }
  }

  /**
   * Returns true if either the feature grid is still actively loading
   */
  isLoading(): boolean {
    return this.features.loading;
  }

  /**
   * Clears the feature grid
   */
  clear(): void {
    this.features.clear();
  }

  /**
   * Ends the drag behavior and emits an update event to parent component
   */
  updateFeatureSelections(): void {
    this.features.dragEnd();
    this.update.emit();
  }

  /**
   * Removes the gene association with the specified symbol from the selections
   * @param {string} symbol - the symbol of the gene association to remove
   */
  removeFeature(symbol: string): void {
    this.features.removeSelection(symbol);
  }
}
