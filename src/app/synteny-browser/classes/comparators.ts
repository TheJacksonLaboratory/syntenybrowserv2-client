import {ClrDatagridComparatorInterface} from '@clr/angular';
import {Feature} from './feature';
import {OntologyTerm} from './interfaces';

/**
 * Comparator for sorting features in the feature search table by ID
 */
export class IDComparator implements ClrDatagridComparatorInterface<any> {
  compare(a, b) {
    return Number(a.id.split(':')[1]) - Number(b.id.split(':')[1]);
  }
}

/**
 * Comparator for sorting features in the feature search table by symbol
 */
export class SymbolComparator implements ClrDatagridComparatorInterface<any> {
  compare(a, b) { return a.symbol.localeCompare(b.symbol); }
}

/**
 * Comparator for sorting features in the feature search table by symbol
 */
export class NameComparator implements ClrDatagridComparatorInterface<any> {
  compare(a, b) {
    return a.name.localeCompare(b.name);
  }
}

/**
 * Comparator for sorting genes in the feature search table by type
 */
export class TypeComparator implements ClrDatagridComparatorInterface<any> {
  compare(a, b) { return a.type.localeCompare(b.type); }
}

/**
 * Comparator for sorting features in the feature search table by chromosome
 */
export class ChrComparator implements ClrDatagridComparatorInterface<any> {
  compare(a, b) {
    // if a.chr is y, b comes first
    if(a.chr.toLowerCase() === 'y') return 1;
    // if b.chr is y, a comes first
    else if(b.chr.toLowerCase() === 'y') return -1;
    // if neither a.chr or b.chr are y and a.chr is x, then b.chr must
    // be a number and comes first
    else if(a.chr.toLowerCase() === 'x') return 1;
    // if neither a.chr or b.chr are y and b.chr is x, then a.chr must
    // be a number and comes first
    else if(b.chr.toLowerCase() === 'x') return -1;
    // if neither a.chr or b.chr are x or y, then compare numerical chr values
    else return Number(a.chr) - Number(b.chr);
  }
}

/**
 * Comparator for sorting genes in the feature search table by type
 */
export class DescendantsComparator implements ClrDatagridComparatorInterface<any> {
  compare(a, b) {
    return a.descendants - b.descendants;
  }
}
