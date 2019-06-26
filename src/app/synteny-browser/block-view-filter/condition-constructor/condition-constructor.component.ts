import { Component, EventEmitter, Input, Output } from '@angular/core';
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

  terms: any;

  @Output() remove: EventEmitter<any> = new EventEmitter();
  @Output() stateChange: EventEmitter<any> = new EventEmitter();

  private valueChanged: Subject<string> = new Subject();

  constructor(private http: ApiService) {
    // if the input value changes, set a emit on a 0.5 sec delay
    this.valueChanged.pipe(debounceTime(1000), distinctUntilChanged())
                     .subscribe(() => this.stateChange.emit());

    this.getTermsForAutocomplete();
  }

  getTermsForAutocomplete(): void {
    if(this.values && this.values.ontology) {
      this.http.getTermsForAutocomplete(this.values.ontology)
        .subscribe(terms => this.terms = terms);
    }
  }

  checkTermChildren(): void {
    if(this.values && this.values.value) {
      console.log(this.terms);
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
