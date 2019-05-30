import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FilterCondition, SearchType } from '../../classes/interfaces';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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

  @Output() remove: EventEmitter<any> = new EventEmitter();
  @Output() stateChange: EventEmitter<any> = new EventEmitter();

  private valueChanged: Subject<string> = new Subject();

  constructor() {
    // if the input value changes, set a emit on a 0.5 sec delay
    this.valueChanged.pipe(debounceTime(500), distinctUntilChanged())
                     .subscribe(() => this.stateChange.emit());
  }


  // Condition Checks

  /**
   * Returns true/false if the condition needs to filter by type
   */
  conditionNeedsTypeSelection(): boolean {
    return this.getAttr() === 'type' && this.isAttributeCondition();
  }

  /**
   * Returns true/false if the condition needs a qualifier selection (necessary
   * when filtering by symbol or id)
   */
  conditionNeedsQualifier(): boolean {
    return this.getAttr() !== 'type' && this.getAttr() !== 'chr' &&
      this.getFilterBy() === 'attribute';
  }

  /**
   * Returns true/false if the condition needs an input (in all circumstances
   * minus that where the condition filters by type)
   */
  conditionNeedsUserInput(): boolean {
    return this.getAttr() !== 'type' || !this.isAttributeCondition();
  }

  /**
   * Returns true/false if the condition is filtering by attribute
   */
  isAttributeCondition(): boolean { return this.getFilterBy() === 'attribute'; }

  /**
   * Returns true/false if the condition is removable (is not the only condition
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
