/**
 * This class is to be used within a Filter class as a single filter can have
 * multiple conditions
 */
export class FilterCondition {
  // attribute to filter features by (ontology term, symbol, id, type, etc.)
  filterBy = '';

  // qualifier to change how matches are found (equal, not equal, like, not like)
  qualifier = 'equal';

  // boolean that will be used for ontology conditions (exact = true, match genes that
  // are associated with term selected; exact = false, match genes that are associated
  // with terms that match the input value
  exact = true;

  // value to match features against when searching utilizing user input
  value: string;

  // controls if the condition can be removed (true unless it's the only condition in a filter)
  removable: boolean;

  // ID to identify it from other conditions in the filter
  id: number;

  // indicates if the condition is currently being edited
  editing = true;

  constructor(id: number) {
    this.id = id;
  }

  /**
   * Returns the title of the filter condition
   */
  getCompleteTitle(): string {
    if (this.filterBy === 'chr') {
      return `Chr${this.value}`;
    }
    if (this.isType()) {
      return `${this.value}s`;
    }
    if (this.isOntology()) {
      return this.value;
    }
    return `${this.filterBy} ${this.getQualifierString()} ${this.value}`;
  }

  /**
   * Returns the selected ontology abbreviation from the filter by its value
   */
  getOntology(): string {
    return this.filterBy.replace('ont-', '');
  }

  /**
   * Returns true if the filter by is by gene ID or gene symbol
   */
  requiresInput(): boolean {
    return this.filterBy === 'id' || this.filterBy === 'symbol';
  }

  /**
   * Returns true if the current type value isn't present in the specified list
   * of types
   * @param {string[]} types - valid types to choose from given the current species
   */
  hasInvalidType(types: string[]): boolean {
    return this.isType() ? types.indexOf(this.value) < 0 : false;
  }

  /**
   * Returns true if all the necessary fields are filled with values
   */
  isComplete(): boolean {
    return !!(this.filterBy && this.qualifier && this.value);
  }

  /**
   * Returns true if this condition is related to an ontology
   */
  isOntology(): boolean {
    return this.filterBy.includes('ont-');
  }

  /**
   * Returns true if this condition is related to feature type
   */
  isType(): boolean {
    return this.filterBy === 'type';
  }

  /**
   * Returns a converted value from the qualifier select value to a
   * human-readable value for a label
   */
  private getQualifierString(): string {
    if (this.qualifier.includes('not')) {
      return this.qualifier.includes('equal') ? '&ne' : 'not like';
    }

    return this.qualifier.includes('equal') ? '=' : 'like';
  }
}
