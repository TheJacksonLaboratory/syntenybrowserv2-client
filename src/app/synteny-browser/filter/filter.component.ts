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
  filterErrorState: string = '';
  validAttrs = ['id', 'symbol', 'type', 'chr'];

  constructor() { }


  // Operational Methods

  /**
   * Add a filter object to the list by parsing the user input
   */
  addFilter(): void {
    let newConditions = [];
    let filterConditions = this.currentFilter.split(' ');

    filterConditions.forEach(c => {
      let attr;
      let value;
      if(c.includes('!=')) {
        attr = c.split('!=')[0].toLowerCase();
        value = c.split('!=')[1].toLowerCase();
      } else if(c.includes('=')) {
        attr = c.split('=')[0].toLowerCase();
        value = c.split('=')[1].toLowerCase();
      }

      if(attr && value) {
        if(this.validAttrs.indexOf(attr.replace('!', '')) < 0) {
          this.filterErrorState = 'Invalid attribute name present';
        } else {
          newConditions.push({
            title: c,
            species: this.conditionSpecies,
            attr: attr.replace('!', ''),
            value: value.replace('+', ' '),
            include: !(attr.includes('!', ''))
          });
        }
      }
    });

    if(!this.filterErrorState) {
      this.filters.push(...newConditions);
      this.currentFilter = '';
    }
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
    return conditionTitle.replace('+', ' ').replace('=', ' = ').replace('!', '');
  }



}
