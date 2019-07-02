import { Component, EventEmitter, Output } from '@angular/core';
import { ApiService} from '../../services/api.service';
import { Species } from '../../classes/species';
import { OntologyTerm } from '../../classes/interfaces';
import { Feature } from '../../classes/feature';
import { ClrLoadingState } from '@clr/angular';
import { TableData } from '../../classes/table-data';


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

  associations: TableData<Feature>;
  associationsSearch: string = '';

  @Output() update: EventEmitter<any> = new EventEmitter();
  @Output() switchView: EventEmitter<any> = new EventEmitter();

  constructor(private http: ApiService) {
    this.terms = new TableData(['id', 'name'], ['id', 'name']);
    this.associations = new TableData(['termID', 'term', 'id', 'symbol'],
                                  ['term', 'id', 'symbol']);
  }

  /**
   * Sets the reference species and current ontology, and retrieves the terms
   * for the specified reference species and ontology and sets the table rows
   * with the results, sorted by ontology term ID
   * @param {Species} refSpecies - the current reference species
   * @param {string} ontology - the ontology ID prefix
   */
  loadTerms(refSpecies: Species, ontology: string): void {
    this.refSpecies = refSpecies;
    this.ontology = ontology;

    this.currentTerm = null;
    this.terms.loading = true;
    this.termsSearch = '';
    this.http.getOntologyTerms(this.ontology)
             .subscribe(terms => this.terms.setRows(terms, 'id'));
  }

  /**
   * Switches the view away from the association table back to the term table
   */
  backToTerms(): void {
    this.currentTerm = null;
    this.switchView.emit();
  }

  /**
   * Retrieves the gene associations for the specified ontology term and switches
   * the view to the associations table if the user wants to see the associations
   * or automatically marks all associations as selected if the user wants all
   * associations
   * @param {OntologyTerm} term - the term selected
   * @param {boolean} showResults - whether the user wants to see the results
   */
  loadAssociationsForTerm(term: OntologyTerm, showResults: boolean = true): void {
    if(!showResults) {
      term.selecting = ClrLoadingState.LOADING;
    }
    this.currentTerm = showResults ? term : null;
    this.associations.loading = showResults;
    this.switchView.emit();

    let termToSearch = this.currentTerm ? this.currentTerm.id : term.id;

    this.http.getAssociationsForTerm(this.refSpecies.getID(), termToSearch)
             .subscribe(genes => {
               if(showResults) {
                 this.associations.setRows(genes, 'term')
               } else {
                 genes.forEach(g => g.select());
                 this.associations.rows = genes;
                 this.associations.selections = genes;
                 term.selecting = ClrLoadingState.SUCCESS;
                 this.update.emit();
               }
             });
  }

  /**
   * Ends the drag behavior and emits an update event to parent component
   */
  updateAssociationSelections(): void {
    this.associations.dragEnd();
    this.update.emit();
  }

  /**
   * Returns the text for the title tooltip describing what the view associations
   * button does and if it's disabled (and the reason)
   * @param {OntologyTerm} term - the term that the tooltip needs content for
   */
  getViewAssociationsTitle(term: OntologyTerm): string {
    return 'View gene associations with this term' +
      (term.count >= 500 ? ' [disabled for being too broad]' : '');
  }

  /**
   * Returns the text for the title tooltip describing what the 'select all
   * associations' button does and if it's disabled (and the reason)
   * @param {OntologyTerm} term - the term that the tooltip needs content for
   */
  getSelectAllAssociationsTitle(term: OntologyTerm): string {
    return 'Select all gene associations with this term' +
      (term.count >= 500 ? ' [disabled for being too broad]' : '');
  }

  /**
   * Removes the gene association with the specified symbol from the selections
   * @param {string} symbol - the symbol of the gene association to remove
   */
  removeAssociation(symbol: string): void {
    this.associations.removeSelection(symbol);
  }
}
