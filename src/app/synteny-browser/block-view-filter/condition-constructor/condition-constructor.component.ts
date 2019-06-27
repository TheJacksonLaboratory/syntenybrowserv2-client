import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FilterCondition, SearchType } from '../../classes/interfaces';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-condition-constructor',
  templateUrl: './condition-constructor.component.html',
  styleUrls: ['./condition-constructor.component.scss']
})
export class ConditionConstructorComponent {
  @Input() attributes: Array<string>;
  @Input() ontologies: Array<SearchType>;
  @Input() types: Array<string>;
  @Input() values: FilterCondition;

  terms: Array<any>;

  @Output() remove: EventEmitter<any> = new EventEmitter();
  @Output() stateChange: EventEmitter<any> = new EventEmitter();
  @Output() warn: EventEmitter<any> = new EventEmitter();

  private valueChanged: Subject<string> = new Subject();

  constructor(private cdr: ChangeDetectorRef, private http: ApiService) {
    // if the input value changes, set a emit on a 0.5 sec delay
    this.valueChanged.pipe(debounceTime(1000), distinctUntilChanged())
                     .subscribe(() => this.stateChange.emit());

    this.getTermsForAutocomplete(true);
  }

  /**
   * Retrieves the ontology terms used in the autocomplete input and will retry
   * the retrieval a couple times before giving up (if clicking on a filter to
   * edit it, the recursive attempts are needed)
   * @param {boolean} retry - whether the method should try more than once if
   *                          'this.values' is false
   * @param {number} numAttempts - how many attempts have already been made to
   *                               get the terms
   */
  getTermsForAutocomplete(retry: boolean, numAttempts: number = 0): void {
    if(this.values) {
      if(this.values.ontology) {
        this.http.getTermsForAutocomplete(this.values.ontology)
                 .subscribe(terms => this.terms = terms);
      }
    } else {
      if(retry && numAttempts <= 2) {
        setTimeout(() => {
          this.getTermsForAutocomplete(true, numAttempts + 1);
        }, 500);
      }
    }
  }

  /**
   * Emits a message if the term that's been selected is too broad to search
   */
  checkTermChildren(): void {
    if(this.values && this.values.value) {
      let terms = this.terms.map(t => t.id);

      let term = this.terms[terms.indexOf(this.values.value)];

      if(term.count && term.count > 500) {
        this.warn.emit('Term too broad');
      } else {
        this.warn.emit('')
      }
    }
  }


  // Condition Checks

  /**
   * Returns true if the condition needs to filter by type
   */
  conditionNeedsTypeSelection(): boolean {
    return this.getAttr() === 'type' && this.isAttributeCondition();
  }

  /**
   * Returns true if the condition needs a qualifier selection (necessary
   * when filtering by symbol or id)
   */
  conditionNeedsQualifier(): boolean {
    return this.getAttr() !== 'type' && this.getAttr() !== 'chr' &&
      this.getFilterBy() === 'attribute';
  }

  /**
   * Returns true if the condition needs an input (in all circumstances
   * minus that where the condition filters by type)
   */
  conditionNeedsUserInput(): boolean {
    return this.getAttr() !== 'type' || !this.isAttributeCondition();
  }

  /**
   * Returns true if the condition is filtering by attribute
   */
  isAttributeCondition(): boolean { return this.getFilterBy() === 'attribute'; }

  /**
   * Returns true if the condition is removable (is not the only condition
   * in the filter)
   */
  isConditionRemovable(): boolean { return this.values.removable; }


  // Private Methods

  /**
   * Returns the current attribute the condition is filtering by
   */
  private getAttr(): string { return this.values.attribute; }

  /**
   * Returns the type of filtering the condition is doing (attribute or ontology)
   */
  private getFilterBy(): string { return this.values.filterBy; }

}
