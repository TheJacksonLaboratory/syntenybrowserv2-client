import {Component, EventEmitter, Output} from '@angular/core';
import {ApiService} from '../../services/api.service';
import {Species} from '../../classes/species';
import {OntologyTerm} from '../../classes/interfaces';
import {Feature} from '../../classes/feature';
import {ClrLoadingState} from '@clr/angular';
import {TableData} from '../../classes/table-data';

@Component({
  selector: 'app-ontology-search',
  templateUrl: './ontology-search.component.html',
  styleUrls: ['./ontology-search.component.scss']
})
export class OntologySearchComponent {
  refSpecies: Species;
  ontology: string;

  terms: TableData<OntologyTerm>;
  termsSearch: string = '';
  currentTerm: OntologyTerm;

  selectingFeatures: ClrLoadingState = ClrLoadingState.DEFAULT;

  features: TableData<Feature>;
  featuresSearch: string = '';

  @Output() update: EventEmitter<any> = new EventEmitter();
  @Output() switchView: EventEmitter<any> = new EventEmitter();

  constructor(private http: ApiService) {
    this.terms = new TableData(['id', 'name'], ['id', 'name']);
    this.features = new TableData(['termID', 'term', 'id', 'symbol'],
                                  ['term', 'id', 'symbol']);
  }

  loadOntologyTerms(refSpecies: Species, ontology: string): void {
    this.refSpecies = refSpecies;
    this.ontology = ontology;

    this.currentTerm = null;
    this.terms.loading = true;
    this.termsSearch = '';
    this.http.getOntologyTerms(this.refSpecies.getID(), this.ontology)
             .subscribe(terms => this.terms.setRows(terms, 'id'));
  }

  backToTerms(): void {
    this.currentTerm = null;
    this.switchView.emit();
  }

  loadFeaturesForTerm(term: OntologyTerm, showResults: boolean = true): void {
    if(!showResults) {
      term.selecting = ClrLoadingState.LOADING;
    }
    this.currentTerm = showResults ? term : null;
    this.features.loading = showResults;
    this.switchView.emit();

    let termToSearch = this.currentTerm ? this.currentTerm.name : term.name;

    this.http.getGeneAssociationsForOntology(this.refSpecies.getID(),
                                             this.ontology,
                                             termToSearch)
             .subscribe(genes => {
               if(showResults) {
                 this.features.setRows(genes, 'term')
               } else {
                 genes.forEach(g => g.select());
                 this.features.rows = genes;
                 this.features.selections = genes;
                 term.selecting = ClrLoadingState.SUCCESS;
                 this.update.emit();
               }
             });
  }

  updateFeatureSelections(): void {
    this.features.dragEnd();
    this.update.emit();
  }

  getViewFeaturesTitle(term: OntologyTerm): string {
    return 'View features associated with this term' +
      (term.descendant_count >= 500 ? ' [disabled for being too broad]' : '');
  }

  getSelectAllFeaturesTitle(term: OntologyTerm): string {
    return 'Select all features associated with this term' +
      (term.descendant_count >= 500 ? ' [disabled for being too broad]' : '');
  }

  removeFeature(symbol: string): void {
    this.features.removeSelection(symbol);
  }
}
