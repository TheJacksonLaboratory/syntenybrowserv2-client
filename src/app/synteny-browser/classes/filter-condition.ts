export class FilterCondition {
  filterBy: string = '';
  qualifier = 'equal';
  exact = true;
  value = null;
  removable: boolean;
  id: number;
  editing = true;

  constructor(id: number) {
    this.id = id;
  }

  getCompleteTitle(): string {
    if(this.filterBy === 'chr') {
      return 'Chr' + this.value;
    } else if(this.isType()) {
      return this.value + 's';
    } else if(this.isOntology()) {
      return this.value;
    } else {
      return `${this.filterBy} ${this.getQualifierString()} ${this.value}`;
    }
  }

  getOntology(): string { return this.filterBy.replace('ont-', ''); }

  requiresInput(): boolean {
    return this.filterBy === 'id' || this.filterBy === 'symbol';
  }

  hasInvalidType(types: string[]): boolean {
    return this.isType() ? types.indexOf(this.value) < 0 : false;
  }

  isComplete(): boolean {
    return !!(this.filterBy && this.qualifier && this.value);
  }

  isOntology(): boolean { return this.filterBy.includes('ont-'); }

  isType(): boolean { return this.filterBy === 'type'; }

  private getQualifierString(): string {
    return this.qualifier.includes('not') ?
      (this.qualifier.includes('equal') ? '&ne' : 'not like') :
      (this.qualifier.includes('equal') ? '=' : 'like')
  }
}
