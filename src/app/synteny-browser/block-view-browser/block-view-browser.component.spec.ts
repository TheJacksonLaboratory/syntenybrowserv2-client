import { async, ComponentFixture, ComponentFixtureAutoDetect, TestBed } from '@angular/core/testing';

import { BlockViewBrowserComponent } from './block-view-browser.component';
import { ClarityModule } from '@clr/angular';
import { FormsModule } from '@angular/forms';
import { QuickNavigationComponent } from './quick-navigation/quick-navigation.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ApiService } from '../services/api.service';
import { MockApiService } from '../testing/mock-api.service';
import { DataStorageService } from '../services/data-storage.service';
import { HUMAN, MOUSE } from '../testing/constants/mock-species';
import { Species } from '../classes/species';
import { MOUSE_TO_HUMAN_SYNTENY } from '../testing/constants/genome-synteny';
import { COLOR_MAP } from '../testing/constants/color-map';
import { SyntenyBlock } from '../classes/synteny-block';
import { SELECTED_QTL_FEATURES, SELECTED_SYNTENIC_FEATURES } from '../testing/constants/mock-features';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

class MockDataStorageService {
  refSpecies = new Species(MOUSE.organism);
  compSpecies = new Species(HUMAN.organism);
  features = {chr: '1', features: []};
  genomeData = MOUSE_TO_HUMAN_SYNTENY.map(b => new SyntenyBlock(b));
  genomeColorMap = COLOR_MAP;
}

fdescribe('BlockViewBrowserComponent', () => {
  let component: BlockViewBrowserComponent;
  let fixture: ComponentFixture<BlockViewBrowserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ClarityModule, FormsModule, NgSelectModule, BrowserAnimationsModule],
      declarations: [BlockViewBrowserComponent, QuickNavigationComponent],
      providers: [
        { provide: ApiService, useClass: MockApiService },
        { provide: DataStorageService, useClass: MockDataStorageService },
        { provide: ComponentFixtureAutoDetect, useValue: true }
      ],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(BlockViewBrowserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });
  }));

  it('should create with default values', () => {
    expect(component).toBeTruthy();
    expect(component.ref).toBeFalsy();
    expect(component.comp).toBeFalsy();
    expect(component.refChr).toBeFalsy();
    expect(component.refInterval).toBe('');
    expect(component.selectedRefGenes.length).toBe(0);
    expect(component.selectedCompGenes.length).toBe(0);
    expect(component.width).toBe(1200);
    expect(component.height).toBe(430);
    expect(component.minimumIntervalSize).toBe(3000);
  });

  it('should have default settings and comparison scale lookup', () => {
    expect(component.options.symbols).toBe(false);
    expect(component.options.anchors).toBe(false);
    expect(component.options.trueOrientation).toBe(false);
    expect(component.options.GWAS).toBe(true);
    expect(component.staticCompBPToPixels.match).toEqual({});
    expect(component.staticCompBPToPixels.true).toEqual({});
  });

  it('gets the correct species, reference chr and scales when rendering', () => {
    component.render();

    expect(component.ref.getID()).toBe('10090');
    expect(component.comp.getID()).toBe('9606');
    expect(component.refChr).toBe('1');
    expect(component.cytoBands.length).toBe(33);
    expect(component.refBPToPixels(0)).toBe(0);
    expect(component.refBPToPixels(0)).toBe(0);
    expect(component.refGMap).toBeTruthy();
  });

  it('defines the required tooltips', () => {
    component.render();

    expect(component.featureTip).toBeTruthy();
    expect(component.blockTip).toBeTruthy();
  });

  it('gathers syntenic blocks', () => {
    component.render();

    expect(Object.keys(component.blockLookup).length).toBe(component.blocks.length);
    expect(Object.keys(component.staticCompBPToPixels.match).length)
      .toBe(component.blocks.length);
    expect(Object.keys(component.staticCompBPToPixels.true).length)
      .toBe(component.blocks.length);
    expect(component.legend.activeChrs.length).toBe(39);
  });

  it('gathers GWAS data', () => {
    component.render();

    expect(component.humanGWAS.length).toBe(42);
    expect(component.humanGWAS[0].location).toBe(207478831);
    expect(component.humanGWAS[0].hits.length).toBe(1);
    expect(component.humanGWAS[16].hits.length).toBe(3);
  });

  it('gathers genes and homologs', () => {
    component.render();

    expect(component.compGenes.length).toBe(5);
    expect(component.refGenes.length).toBe(5);
    expect(component.selectedRefGenes.length).toBe(0);
    expect(component.selectedCompGenes.length).toBe(0);
    expect(component.interval.refStart).toBe(0);
    expect(component.interval.refEnd).toBe(195471971);
    expect(component.interval.trueOrientation).toBe(false);
  });

  it('can jump to an interval', () => {
    component.render();
    component.jumpToInterval([103106575, 113142630]);

    expect(component.interval.refStart).toBe(103106575);
    expect(component.interval.refEnd).toBe(113142630);
  });

  it('can pan left normally', () => {
    component.render();

    // we're using this function to move the view instead of exposing the private method
    component.jumpToInterval([103106575, 113142630]);
    component.panLeft();

    expect(component.interval.refStart).toBe(101601167);
    expect(component.interval.refEnd).toBe(111637222);
  });

  it('will not surpass 0 when panning left', () => {
    component.render();
    component.jumpToInterval([1726633, 20935426]);
    component.panLeft();

    expect(component.interval.refStart).toBe(0);
    expect(component.interval.refEnd).toBe(19208793);

    // try again and expect that the interval hasn't changed
    component.panLeft();

    expect(component.interval.refStart).toBe(0);
    expect(component.interval.refEnd).toBe(19208793);
  });

  it('can pan right normally', () => {
    component.render();
    component.jumpToInterval([103106575, 113142630]);
    component.panRight();

    expect(component.interval.refStart).toBe(104611983);
    expect(component.interval.refEnd).toBe(114648038);
  });

  it('will not surpass reference chromosome max when panning right', () => {
    component.render();
    component.jumpToInterval([173742439, 192951232]);
    component.panRight();

    expect(component.interval.refStart).toBe(176263178);
    expect(component.interval.refEnd).toBe(195471971);

    component.panRight();

    expect(component.interval.refStart).toBe(176263178);
    expect(component.interval.refEnd).toBe(195471971);
  });

  it('can zoom out normally', () => {
    component.render();
    component.jumpToInterval([103106575, 113142630]);
    component.zoomOut();

    expect(component.interval.refStart).toBe(101601167);
    expect(component.interval.refEnd).toBe(114648038);
  });

  it('will not zoom out past the reference chromosome extents', () => {
    component.render();
    component.jumpToInterval([1402889, 192989936]);
    component.zoomOut();

    expect(component.interval.refStart).toBe(0);
    expect(component.interval.refEnd).toBe(195471971);

    component.zoomOut();

    expect(component.interval.refStart).toBe(0);
    expect(component.interval.refEnd).toBe(195471971);
  });

  it('can zoom in normally', () => {
    component.render();
    component.jumpToInterval([103106575, 113142630]);
    component.zoomIn();

    expect(component.interval.refStart).toBe(104611983);
    expect(component.interval.refEnd).toBe(111637222);
  });

  it('will not zoom in past the minimum interval size', () => {
    component.render();
    component.jumpToInterval([73891948, 73894848]);
    component.zoomIn();

    expect(component.interval.refStart).toBe(73891898);
    expect(component.interval.refEnd).toBe(73894898);

    component.zoomIn();

    expect(component.interval.refStart).toBe(73891898);
    expect(component.interval.refEnd).toBe(73894898);
  });

  it('will not render "jump to feature" menu button if no features selected', () => {
    component.render();
    fixture.detectChanges();

    expect(component.featuresAreSelected()).toBe(false);
    expect(fixture.nativeElement.querySelector('.group-dropdown')).toBeFalsy();
  });

  it('should show selected genes', () => {
    component.data.features.features = SELECTED_SYNTENIC_FEATURES;
    component.render();

    expect(component.selectedRefGenes.length).toBe(3);
    expect(component.selectedCompGenes.length).toBe(4);
    expect(component.selectedQTLs.length).toBe(0);

    expect(component.interval.refStart).toBe(180586266);
    expect(component.interval.refEnd).toBe(185721522);
  });

  it('should show selected QTLs', () => {
    component.data.features.features = SELECTED_QTL_FEATURES;
    component.render();

    expect(component.selectedRefGenes.length).toBe(0);
    expect(component.selectedCompGenes.length).toBe(0);
    expect(component.selectedQTLs.length).toBe(2);

    expect(component.interval.refStart).toBe(0);
    expect(component.interval.refEnd).toBe(195471971);
  });

  it('should be able to show selected genes and QTLs', () => {
    component.data.features.features = [...SELECTED_SYNTENIC_FEATURES, ...SELECTED_QTL_FEATURES];
    component.render();

    expect(component.selectedRefGenes.length).toBe(3);
    expect(component.selectedCompGenes.length).toBe(4);
    expect(component.selectedQTLs.length).toBe(2);

    expect(component.interval.refStart).toBe(180586266);
    expect(component.interval.refEnd).toBe(185721522);
  });

  it('should show "jump to feature" menu for selected genes', () => {
    component.data.features.features = SELECTED_SYNTENIC_FEATURES;
    component.render();
    fixture.detectChanges();

    const dropdownBtn = fixture.debugElement.query(By.css('.group-dropdown'));
    dropdownBtn.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.dropdown-header').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.dropdown-header').textContent).toBe('Genes');
    expect(fixture.nativeElement.querySelectorAll('button.dropdown-item').length).toBe(3);
    expect(fixture.nativeElement.querySelector('.dropdown-divider')).toBeFalsy();
  });

  it('should show "jump to feature" menu for selected QTLs', () => {
    component.data.features.features = SELECTED_QTL_FEATURES;
    component.render();
    fixture.detectChanges();

    const dropdownBtn = fixture.debugElement.query(By.css('.group-dropdown'));
    dropdownBtn.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.dropdown-header').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.dropdown-header').textContent).toBe('QTLs');
    expect(fixture.nativeElement.querySelectorAll('button.dropdown-item').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.dropdown-divider')).toBeFalsy();

  });

  it('should show "jump to feature" menu for selected genes and QTLs', () => {
    component.data.features.features = [...SELECTED_SYNTENIC_FEATURES, ...SELECTED_QTL_FEATURES];
    component.render();
    fixture.detectChanges();

    const dropdownBtn = fixture.debugElement.query(By.css('.group-dropdown'));
    dropdownBtn.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.dropdown-header').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.dropdown-header')[0].textContent).toBe('Genes');
    expect(fixture.nativeElement.querySelectorAll('.dropdown-header')[1].textContent).toBe('QTLs');
    expect(fixture.nativeElement.querySelectorAll('button.dropdown-item').length).toBe(5);
    expect(fixture.nativeElement.querySelector('.dropdown-divider')).toBeTruthy();
  });

  it('jumps to a gene', () => {
    component.data.features.features = SELECTED_SYNTENIC_FEATURES;
    component.render();
    component.jumpToFeature(SELECTED_SYNTENIC_FEATURES[1]);

    expect(component.interval.refStart).toBe(8798107);
    expect(component.interval.refEnd).toBe(10900845);
  });

  it('jumps to a QTL', () => {
    component.data.features.features = SELECTED_QTL_FEATURES;
    component.render();
    component.jumpToFeature(SELECTED_QTL_FEATURES[1]);

    expect(component.interval.refStart).toBe(61907596);
    expect(component.interval.refEnd).toBe(121601949);
  });

  it('downloads', () => {
    const spyOnSetObjectAttributes = spyOn(component, 'setObjectAttributes');
    const spyOnDownloader = spyOn(component.downloader, 'downloadSVG');
    component.render();
    fixture.detectChanges();

    // expect all of the default including that the modal won't be visible
    expect(fixture.nativeElement.querySelector('.modal')).toBeFalsy();
    expect(component.filenameModalOpen).toBe(false);
    expect(component.downloadFilename).toBe('');

    // click on the icon button to download
    const downloadIconBtn = fixture.debugElement.query(By.css('#block-view-download'));
    downloadIconBtn.triggerEventHandler('click', null);
    fixture.detectChanges();

    // which should open the modal
    expect(fixture.nativeElement.querySelector('.modal')).toBeTruthy();
    expect(component.filenameModalOpen).toBe(true);

    const downloadBtn = fixture.debugElement.query(By.css('#download-btn'));

    // expect that the filename value is empty and thus that the download button is disabled
    expect(component.downloadFilename).toBe('');
    expect(fixture.debugElement.nativeElement.querySelector('#download-btn').disabled).toBe(true);

    // enter a filename
    component.downloadFilename = 'some-filename';
    fixture.detectChanges();

    // expect that the download button is now enabled
    expect(fixture.debugElement.nativeElement.querySelector('#download-btn').disabled).toBe(false);

    // click the download button
    downloadBtn.triggerEventHandler('click', null);
    fixture.detectChanges();

    // expect that the downloading functions have been called and that the modal is closed, filename reset
    expect(spyOnSetObjectAttributes).toHaveBeenCalled();
    expect(spyOnDownloader).toHaveBeenCalled();
    expect(component.filenameModalOpen).toBe(false);
    expect(component.downloadFilename).toBe('');
  });

  it('can toggle gene symbols', () => {
    component.render();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.reference-gene-symbol').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.comparison-gene-symbol').length).toBe(0);

    component.options.symbols = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.reference-gene-symbol').length).toBe(5);
    expect(fixture.nativeElement.querySelectorAll('.comparison-gene-symbol').length).toBe(5);

    component.options.symbols = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.reference-gene-symbol').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.comparison-gene-symbol').length).toBe(0);
  });

  it('can toggle gene anchors', () => {
    component.render();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('#gene-anchors path').length).toBe(0);

    component.options.anchors = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('#gene-anchors path').length).toBe(4);

    component.options.anchors = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('#gene-anchors path').length).toBe(0);
  });

  it('can toggle true and matching orientation', () => {
    component.render();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('#orientation-indicators g').length).toBe(17);
    // the first block in chr 1 has unmatched orientation
    expect(component.blocks[0].getBlockCompStartLabel(component.options.trueOrientation)).toBe('8:55,526,155bp');
    expect(component.blocks[0].getBlockCompEndLabel(component.options.trueOrientation)).toBe('8:49,909,726bp');

    component.options.trueOrientation = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('#orientation-indicators g').length).toBe(0);
    // check that the labels have switched
    expect(component.blocks[0].getBlockCompStartLabel(component.options.trueOrientation)).toBe('8:49,909,726bp');
    expect(component.blocks[0].getBlockCompEndLabel(component.options.trueOrientation)).toBe('8:55,526,155bp');

    component.options.trueOrientation = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('#orientation-indicators g').length).toBe(17);
    expect(component.blocks[0].getBlockCompStartLabel(component.options.trueOrientation)).toBe('8:55,526,155bp');
    expect(component.blocks[0].getBlockCompEndLabel(component.options.trueOrientation)).toBe('8:49,909,726bp');
  });

  it('can toggle GWAS', () => {
    component.render();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.human-gwas').length).toBe(42);
    expect(fixture.nativeElement.querySelectorAll('.human-gwas-handle').length).toBe(42);

    component.options.GWAS = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.human-gwas').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.human-gwas-handle').length).toBe(0);

    component.options.GWAS = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.human-gwas').length).toBe(42);
    expect(fixture.nativeElement.querySelectorAll('.human-gwas-handle').length).toBe(42);
  });
});
