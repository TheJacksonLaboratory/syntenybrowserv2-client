import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Species } from '../../classes/species';
import { ApiService } from '../../services/api.service';
import { TableData } from '../../classes/table-data';
import { Feature } from '../../classes/feature';

@Component({
  selector: 'app-feature-search',
  templateUrl: './feature-search.component.html',
  styleUrls: ['./feature-search.component.scss']
})
export class FeatureSearchComponent {
  refSpecies: Species;

  features: TableData<Feature>;
  featuresSearch: string = '';

  @Output() update: EventEmitter<any> = new EventEmitter();

  constructor(private http: ApiService) {
    this.features = new TableData(['id', 'symbol', 'chr', 'start', 'end', 'type'],
                                  ['id', 'symbol', 'type']);
  }

  /**
   * Sets the reference species, retrieves the terms or the specified reference
   * species and ontology and sets the table rows with the results, sorted by
   * gene symbol
   * @param {Species} refSpecies - the current reference species
   */
  loadFeatures(refSpecies: Species): void {
    this.refSpecies = refSpecies;
    this.http.getAllGenes(this.refSpecies.getID())
             .subscribe(genes => {
               let rows = genes;

               if(this.refSpecies.hasQTLs) {
                 this.http.getAllQTLs(this.refSpecies.getID())
                          .subscribe(qtls => {
                            rows.push(...qtls);
                            this.features.setRows(rows, 'symbol');
                          });
               } else {
                 this.features.setRows(rows, 'symbol');
               }
             });
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
  removeFeature(symbol: string): void { this.features.removeSelection(symbol); }

}