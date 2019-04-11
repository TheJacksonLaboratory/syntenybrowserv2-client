import {Species} from './species';
import {FilterCondition} from './interfaces';
import {Gene} from './gene';

export class Filter {
  attributes = [ 'type', 'id', 'symbol', 'chr' ];

  mode: string = 'Highlight';
  speciesKey: string = 'both';
  refSpecies: Species;
  compSpecies: Species;
  conditions: Array<FilterCondition> = [];
  id: number;

  selected: boolean = true;
  created: boolean = false;
  editing: boolean = true;

  constructor(ref: Species, comp: Species, id: number) {
    this.refSpecies = ref;
    this.compSpecies = comp;
    this.id = id;

    this.addNewCondition();
  }

  addNewCondition(): void {
    this.conditions.push({
      filterBy: 'attribute',
      attribute: 'type',
      type: null,
      qualifier: 'equal',
      value: '',
      removable: this.conditions.length > 0,
      id: this.conditions.length});
  }

  removeCondition(cond: FilterCondition): void {
    // remove the condition from the condition array
    this.conditions.splice(cond.id, 1);

    // fix the ids to reflect the conditions' new positions in the array
    this.conditions.forEach((c, i) => c.id = i);
  }

  getValidAttrs(): Array<string> {
    return this.speciesKey === 'ref' ?
           this.attributes.filter(a => a !== 'chr') : this.attributes;
  }

  hides(): boolean { return this.mode === 'Hide'; }

  /**
   * Returns true/false if the specified gene matches ALL of the filter's conditions
   * @param {Gene} gene - the gene to check against all conditions
   */
  matchesFilter(gene: Gene): boolean {
    for(let i = 0; i < this.conditions.length; i++) {
      if(!this.matchesCondition(gene, this.conditions[i])) return false;
    }

    return true;
  }

  matchesCondition(gene: Gene, cond: FilterCondition): boolean {
    let geneValue = gene[cond.attribute];
    let condValue = this.getConditionValue(cond);

    if(cond.qualifier.includes('not')) {
      return cond.qualifier.includes('equal') ?
               geneValue !== condValue : !geneValue.includes(condValue);
    } else {
      return cond.qualifier.includes('equal') ?
               geneValue === condValue : geneValue.includes(condValue);
    }
  }

  allConditionsAreComplete(): boolean {
    return this.conditions.filter(c => !this.getConditionValue(c)).length === 0;
  }

  getConditionValue(cond: FilterCondition): string {
    return cond.attribute === 'type' ? cond.type : cond.value;
  }

  isRefFilter(): boolean { return this.speciesKey !== 'comp' };

  isCompFilter(): boolean { return this.speciesKey !== 'ref'; }

  /**
   * Returns the label text for the filter based on title (adds formatting)
   */
  getStringifiedConditions(): string {
    return this.conditions.map(c => this.getCompiledCondition(c)).join(' AND ');
  }

  getLabel(): string {
    return `${this.mode} [${this.getStringifiedConditions()}] in ${this.getSpecies()}`;
  }

  private getCompiledCondition(cond: FilterCondition): string {
    let value = cond.attribute === 'type' ? cond.type : cond.value;
    return cond.attribute + this.getQualifier(cond) + value;
  }

  getColor(): string { return this.hides() ? '#F00' : '#2A9FE0'; }

  private getQualifier(condition: FilterCondition): string {
    let qualifier = condition.qualifier;
    return qualifier.includes('not') ?
           (qualifier.includes('equal') ? ' &ne ' : ' not like ') :
           (qualifier.includes('equal') ? ' = ' : ' like ')
  }

  getSpecies(): string {
    return (this.speciesKey === 'ref' ? this.refSpecies.commonName :
             (this.speciesKey === 'comp' ? this.compSpecies.commonName :
               this.refSpecies.commonName + ' & ' + this.compSpecies.commonName));
  }

  getTSVRowForFilter(): string {
    let conds = this.getStringifiedConditions();
    return [ this.mode, this.getSpecies(), conds ].join('\t');
  }
}
