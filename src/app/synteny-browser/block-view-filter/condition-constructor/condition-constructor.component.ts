import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FilterCondition} from '../../classes/interfaces';
import {Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';

@Component({
  selector: 'app-condition-constructor',
  templateUrl: './condition-constructor.component.html',
  styleUrls: ['./condition-constructor.component.scss']
})
export class ConditionConstructorComponent {
  @Input() attributes: Array<string>;
  @Input() types: Array<string>;
  @Input() values: FilterCondition;

  @Output() remove: EventEmitter<any> = new EventEmitter();
  @Output() stateChange: EventEmitter<any> = new EventEmitter();

  private valueChanged: Subject<string> = new Subject();

  constructor() {
    // if the input value changes, set a emit delay
    this.valueChanged.pipe(debounceTime(500), distinctUntilChanged())
                     .subscribe(() => this.stateChange.emit());
  }

  conditionNeedsTypeSelection(): boolean { return this.getAttr() === 'type'; }

  conditionNeedsQualifier(): boolean {
    return this.getAttr() !== 'type' && this.getAttr() !== 'chr';
  }

  conditionNeedsUserInput(): boolean { return this.getAttr() !== 'type'; }

  isAttributeCondition(): boolean { return this.getFilterBy() === 'attribute'; }

  isConditionRemovable(): boolean { return this.values.removable; }

  private getAttr(): string { return this.values.attribute; }

  private getFilterBy(): string { return this.values.filterBy; }

}
