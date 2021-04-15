// These comparator classes are the recommended way to sort datagrids but they
// don't use class variables in the compare function (because they don't need to)
// and since these comparators are all fairly related, it makes sense for them to
// all be together as opposed to having six separate files
/* eslint-disable class-methods-use-this, max-classes-per-file */

import { ClrDatagridComparatorInterface } from '@clr/angular';

/**
 * Comparator for sorting features in the feature search table by ID
 */
export class IDComparator implements ClrDatagridComparatorInterface<any> {
  compare(a, b): number {
    return Number(a.id.split(':')[1]) - Number(b.id.split(':')[1]);
  }
}

/**
 * Comparator for sorting features in the feature search table by symbol
 */
export class SymbolComparator implements ClrDatagridComparatorInterface<any> {
  compare(a, b): number {
    return a.symbol.localeCompare(b.symbol);
  }
}

/**
 * Comparator for sorting features in the feature search table by symbol
 */
export class NameComparator implements ClrDatagridComparatorInterface<any> {
  compare(a, b): number {
    return a.name.localeCompare(b.name);
  }
}

/**
 * Comparator for sorting genes in the feature search table by type
 */
export class TypeComparator implements ClrDatagridComparatorInterface<any> {
  compare(a, b): number {
    return a.type.localeCompare(b.type);
  }
}

/**
 * Comparator for sorting features in the feature search table by chromosome
 */
export class ChrComparator implements ClrDatagridComparatorInterface<any> {
  compare(a, b): number {
    // if a.chr is y, b comes first
    if (a.chr.toLowerCase() === 'y') {
      return 1;
    }
    // if b.chr is y, a comes first
    if (b.chr.toLowerCase() === 'y') {
      return -1;
    }
    // if neither a.chr or b.chr are y and a.chr is x, then b.chr must
    // be a number and comes first
    if (a.chr.toLowerCase() === 'x') {
      return 1;
    }
    // if neither a.chr or b.chr are y and b.chr is x, then a.chr must
    // be a number and comes first
    if (b.chr.toLowerCase() === 'x') {
      return -1;
    }
    // if neither a.chr or b.chr are x or y, then compare numerical chr values
    return Number(a.chr) - Number(b.chr);
  }
}

/**
 * Comparator for sorting genes in the feature search table by type
 */
export class DescendantsComparator implements ClrDatagridComparatorInterface<any> {
  compare(a, b): number {
    return a.descendants - b.descendants;
  }
}
