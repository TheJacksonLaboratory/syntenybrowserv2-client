import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockViewFilterComponent } from './block-view-filter.component';
import { ClarityModule } from '@clr/angular';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ApiService } from '../services/api.service';
import { MockApiService } from '../testing/mock-api.service';
import { Species } from '../classes/species';
import { HUMAN, MOUSE } from '../testing/constants/mock-species';

describe('BlockViewFilterComponent', () => {
  let component: BlockViewFilterComponent;
  let fixture: ComponentFixture<BlockViewFilterComponent>;
  let ref: Species = new Species(MOUSE.organism);
  let comp: Species = new Species(HUMAN.organism);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ClarityModule, FormsModule, NgSelectModule],
      declarations: [BlockViewFilterComponent],
      providers: [
        { provide: ApiService, useClass: MockApiService }
      ],
    }).compileComponents();
  }));

  beforeAll(() => {

  })

  beforeEach(() => {
    fixture = TestBed.createComponent(BlockViewFilterComponent);
    component = fixture.componentInstance;
    component.refGenes = [];
    component.compGenes = [];
    component.filters = [];
    component.refSpecies = ref;
    component.compSpecies = comp;
    component.ngOnInit();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
