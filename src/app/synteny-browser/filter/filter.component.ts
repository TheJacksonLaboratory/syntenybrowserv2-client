import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Species } from '../classes/species';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent {
  @Input() refSpecies: Species;
  @Input() compSpecies: Species;
  @Input() filters: Array<any>;

  currentFilter: string = '';
  conditionSpecies: string = 'both';
  filterErrorState: string = null;
  validAttrs = ['id', 'symbol', 'type', 'chr'];

  constructor() { }


  // Operational Methods

  /**
   * Add a filter object to the list by parsing the user input
   */
  addFilter(): void {
    let condition = this.currentFilter;
    this.filterErrorState = null;

    let newCondition;
    let attr;
    let value;
    
    if(condition.includes(' ')) {
      this.filterErrorState = "Replace any spaces with '+'";
      return
    } else {
      attr = condition.split('=')[0].toLowerCase();
      value = condition.split('=')[1].toLowerCase();
    }

    if(this.validAttrs.indexOf(attr.replace(/!/g, '')) < 0) {
      this.filterErrorState = 'Invalid attribute name';
      return
    } else {
        newCondition = { title: condition,
                         species: this.conditionSpecies,
                         attr: attr.replace(/!/g, ''),
                         value: value.replace(/\+/g, ' '),
                         include: !(attr.includes('!', '')) }
    }

    this.filters.push(newCondition);
    this.currentFilter = '';
  }

  /**
   * Remove the specified filter from the list of filters
   * @param {string} conditionTitle - the title of the filter to remove
   */
  removeFilter(conditionTitle: string): void {
    this.filters = this.filters.filter(f => f.title !== conditionTitle);
  }

  /**
   * TODO: runs the current filter through the block view gene lists and shows
   *       user how many genes would satisfy their current filter conditions
   *       before adding the filter to the list
   */
  testFilter() {}


  // Getter Methods

  /**
   * Returns the label text for the specified condition title (adds formatting)
   * @param {string} conditionTitle - the title of the condition
   */
  getConditionLabel(conditionTitle: string): string {
    return conditionTitle.replace(/=/g, ' = ')
                         .replace(/!/g, '')
                         .replace(/\+/g, ' ');
  }



}
