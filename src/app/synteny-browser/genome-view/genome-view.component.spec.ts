import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GenomeViewComponent } from './genome-view.component';
import { ClarityModule } from '@clr/angular';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { MockApiService } from '../testing/mock-api.service';
import { DataStorageService } from '../services/data-storage.service';
import { Species } from '../classes/species';
import { HUMAN, MOUSE } from '../testing/constants/mock-species';
import { COLOR_MAP } from '../testing/constants/color-map';
import { Feature } from '../classes/feature';
import { SyntenyBlock } from '../classes/synteny-block';
import {
  SELECTED_FEATURE_MULTI_BLOCK,
  SELECTED_FEATURES_NO_SYNTENY,
  SELECTED_QTL_FEATURES
} from '../testing/constants/mock-features';

class MockDataStorageService {
  refSpecies = new Species(MOUSE.organism);
  compSpecies = new Species(HUMAN.organism);
  genomeColorMap = COLOR_MAP;
  genomeData;

  getFeatureBlocks(features: Feature[]): SyntenyBlock[] {
    return [].concat(...features.map(f => this.getBlocksForFeature(f)));
  }

  isFeatureNonSyntenic(feature: Feature): boolean {
    return !this.getBlocksForFeature(feature).length;
  }

  getChrBlocks(chr: string, blockList: SyntenyBlock[] = this.genomeData): SyntenyBlock[] {
    return blockList.filter(b => b.matchesRefChr(chr));
  }

  private getBlocksForFeature(feature: Feature): SyntenyBlock[] {
    return this.genomeData.filter(b => b.isAFeatureBlock(feature));
  }
}

describe('GenomeViewComponent', () => {
  let comp: GenomeViewComponent;
  let fixture: ComponentFixture<GenomeViewComponent>;
  const getNumericValues = (pos) => pos.replace('translate(', '').replace(')', '').split(', ');

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ClarityModule, FormsModule],
      declarations: [GenomeViewComponent],
      providers: [
        { provide: ApiService, useClass: MockApiService },
        { provide: DataStorageService, useClass: MockDataStorageService }
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GenomeViewComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with empty data structures by default', () => {
    expect(comp).toBeTruthy();
    expect(comp.ref).toBeFalsy();
    expect(comp.comp).toBeFalsy();
    expect(comp.refGMap).toBeFalsy();
    expect(comp.compGMap).toBeFalsy();

    expect(comp.features).toBeFalsy();
    expect(comp.featuresNoBlocks).toBeFalsy();
  });

  it('should generate dimensions that make the plot as large as possible', () => {
    expect(comp.width).toBe(500);
    expect(comp.height).toBe(510);
    expect(comp.bandThickness).toBe(21);
    expect(comp.refRadii.ringInner).toBe(188);
    expect(comp.refRadii.ringOuter).toBe(209);
    expect(comp.refRadii.labels).toBe(219);
    expect(comp.featureRadii.ringOuter).toBe(188);
    expect(comp.featureRadii.ringInner).toBe(172.25);
    expect(comp.compRadii.ringInner).toBe(125);
    expect(comp.compRadii.ringOuter).toBe(146);
    expect(comp.compRadii.labels).toBe(156);
  });

  it('renders', () => {
    comp.render();

    expect(comp.ref.getID()).toBe('10090');
    expect(comp.comp.getID()).toBe('9606');
    expect(comp.refGMap).toBeTruthy();
    expect(comp.compGMap).toBeTruthy();
    expect(comp.ref.getChromosomes().length).toBe(21);
    expect(comp.comp.getChromosomes().length).toBe(24);
    expect(comp.getGenomeBlocks().length).toBeGreaterThan(0);
    expect(comp.getChrsWithFeatures().length).toBe(0);
    expect(comp.features.length).toBe(0);
    expect(comp.featuresNoBlocks.length).toBe(0);
  });

  it('renders with selected features', () => {
    comp.render();
    comp.updateFeatures(SELECTED_FEATURES_NO_SYNTENY);
    expect(comp.getChrsWithFeatures().length).toBe(1);
    expect(comp.features.length).toBe(3);
  });

  it('changes the plot dimensions to acccommodate legend', () => {
    comp.render();
    comp.updateFeatures(SELECTED_FEATURE_MULTI_BLOCK);

    expect(comp.bandThickness).toBe(18);
    expect(comp.refRadii.ringInner).toBe(155);
    expect(comp.refRadii.ringOuter).toBe(173);
    expect(comp.refRadii.labels).toBe(183);
    expect(comp.featureRadii.ringOuter).toBe(155);
    expect(comp.featureRadii.ringInner).toBe(141.5);
    expect(comp.compRadii.ringInner).toBe(100);
    expect(comp.compRadii.ringOuter).toBe(118);
    expect(comp.compRadii.labels).toBe(128);
  });

  it('changes the plot dimensions to acccommodate legend even with several features', () => {
    comp.render();
    comp.updateFeatures([
      ...SELECTED_FEATURE_MULTI_BLOCK,
      ...SELECTED_FEATURES_NO_SYNTENY,
      ...SELECTED_QTL_FEATURES
    ]);

    expect(comp.bandThickness).toBe(18);
    expect(comp.refRadii.ringInner).toBe(155);
    expect(comp.refRadii.ringOuter).toBe(173);
    expect(comp.refRadii.labels).toBe(183);
    expect(comp.featureRadii.ringOuter).toBe(155);
    expect(comp.featureRadii.ringInner).toBe(141.5);
    expect(comp.compRadii.ringInner).toBe(100);
    expect(comp.compRadii.ringOuter).toBe(118);
    expect(comp.compRadii.labels).toBe(128);
  });

  it('correctly identifies non-syntenic gene features', () => {
    comp.render();
    comp.updateFeatures(SELECTED_FEATURES_NO_SYNTENY);

    expect(comp.getChrsWithFeatures().length).toBe(1);
    expect(comp.features.length).toBe(3);
    expect(comp.featuresNoBlocks.length).toBe(3);
    expect(comp.featureBlocks.length).toBe(0);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#non-syntenic-feature-list')).toBeTruthy();
  });

  it('correctly identifies all blocks for gene feature that spans more than one', () => {
    comp.render();
    comp.updateFeatures(SELECTED_FEATURE_MULTI_BLOCK);

    expect(comp.getChrsWithFeatures().length).toBe(1);
    expect(comp.features.length).toBe(1);
    expect(comp.featuresNoBlocks.length).toBe(0);
    expect(comp.featureBlocks.length).toBe(3);
  });

  it('correctly identifies all blocks for QTL features', () => {
    comp.render();
    comp.updateFeatures(SELECTED_QTL_FEATURES);

    expect(comp.getChrsWithFeatures().length).toBe(1);
    expect(comp.features.length).toBe(2);
    expect(comp.featuresNoBlocks.length).toBe(0);
    expect(comp.featureBlocks.length).toBe(11);
  });

  it('clears gene features if passed an empty list', () => {
    comp.render();
    comp.updateFeatures(SELECTED_FEATURES_NO_SYNTENY);

    expect(comp.getChrsWithFeatures().length).toBe(1);
    expect(comp.features.length).toBe(3);
    expect(comp.featuresNoBlocks.length).toBe(3);
    expect(comp.featureBlocks.length).toBe(0);

    comp.updateFeatures([]);
    expect(comp.getChrsWithFeatures().length).toBe(0);
    expect(comp.features.length).toBe(0);
    expect(comp.featuresNoBlocks.length).toBe(0);
    expect(comp.featureBlocks.length).toBe(0);
    expect(comp.bandThickness).toBe(21);
    expect(comp.refRadii.ringInner).toBe(188);
    expect(comp.refRadii.ringOuter).toBe(209);
    expect(comp.refRadii.labels).toBe(219);
    expect(comp.featureRadii.ringOuter).toBe(188);
    expect(comp.featureRadii.ringInner).toBe(172.25);
    expect(comp.compRadii.ringInner).toBe(125);
    expect(comp.compRadii.ringOuter).toBe(146);
    expect(comp.compRadii.labels).toBe(156);
  });

  it('renders a full chord mapping when a chromosome is clicked', () => {
    comp.render();
    expect(comp.refGMap.sizes.length).toBe(21)
    expect(comp.compGMap.sizes.length).toBe(24);

    comp.renderChordMapForChr("1");

    expect(comp.refChr.chr).toBe('ref1');
    expect(comp.refChr.size).toBe(195471971);
    expect(comp.refChr.blocks.length).toBe(39);
    expect(comp.refGMap.sizes.length).toBe(21)
    expect(comp.compGMap.sizes.length).toBe(25);
  });

  it('renders a select chord mapping when a chromosome is selected with features', () => {
    comp.render();
    comp.updateFeatures(SELECTED_QTL_FEATURES);
    comp.renderChordMapForChr("1");

    expect(comp.refChr.chr).toBe('ref1');
    expect(comp.refChr.size).toBe(195471971);
    expect(comp.refChr.blocks.length).toBe(11);
  });

  it('renders a full chord mapping if all selected features in chromosome are non-syntenic', () => {
    comp.render();
    comp.updateFeatures(SELECTED_FEATURES_NO_SYNTENY);
    comp.renderChordMapForChr("1");

    expect(comp.refChr.blocks.length).toBe(39);
  });

  it('generates a correct translation string', () => {
    expect(comp.translate(0, 0)).toBe('translate(0, 0)');
    expect(comp.translate(-2, 0)).toBe('translate(-2, 0)');
    expect(comp.translate(2, 2)).toBe('translate(2, 2)');
  });

  it('gets all genome synteny blocks', () => {
    comp.render();

    expect(comp.getGenomeBlocks().length).toBe(42);
  });

  it('gets the correct colors for chromosomes', () => {
    comp.render();

    expect(comp.getChrColor('1')).toBe('#f74600');
    expect(comp.getChrColor('Y')).toBe('#ea9399');
  });

  it('aligns legend text properly', () => {
    comp.render();

    expect(comp.getLegendListAlign('1')).toBe('middle');
    expect(comp.getLegendListAlign('5')).toBe('start');
    expect(comp.getLegendListAlign('10')).toBe('middle');
    expect(comp.getLegendListAlign('16')).toBe('end');
    expect(comp.getLegendListAlign('X')).toBe('middle');
  });

  it('positions legend text properly', () => {
    comp.render();

    expect(comp.getLegendListItemPosition('1', 0)).toBe('translate(0, 0)');
    expect(comp.getLegendListItemPosition('1', 1)).toBe('translate(0, -8)');
    expect(comp.getLegendListItemPosition('10', 0)).toBe('translate(0, 0)');
    expect(comp.getLegendListItemPosition('10', 1)).toBe('translate(0, 8)');
    expect(comp.getLegendListItemPosition('16', 3)).toBe('translate(0, -24)');
    expect(comp.getLegendListItemPosition('X', 0)).toBe('translate(0, 0)');
  });

  it('positions legend list properly', () => {
    comp.render();

    expect(comp.getLegendListPosition('1')).toBe('translate(45.35964320345851, -231.97278228366858)');
    expect(comp.getLegendListPosition('5')).toBe('translate(219.3574417918143, 49.28647730061313)');
    expect(comp.getLegendListPosition('10')).toBe('translate(-33.48818590999784, 240.0435892168229)');
    expect(comp.getLegendListPosition('16')).toBe('translate(-218.82381326511438, -62.72623202508949)');
    expect(comp.getLegendListPosition('X')).toBe('translate(-95.84674928186719, -220.5273379010505)');
  });

  it('positions comparison chromosome labels properly before chromosome select', () => {
    comp.render();

    expect(comp.getCompLabelPos('1', comp.compGMap)).toBe('translate(32.911500588674706, -148.2695311867227)');
    expect(comp.getCompLabelPos('5', comp.compGMap)).toBe('translate(148.99184651337086, 45.87710320799903)');
    expect(comp.getCompLabelPos('10', comp.compGMap)).toBe('translate(-38.170780503464805, 154.2580295910148)');
    expect(comp.getCompLabelPos('16', comp.compGMap)).toBe('translate(-154.69833651506997, -16.110312764105984)');
    expect(comp.getCompLabelPos('X', comp.compGMap)).toBe('translate(-47.72359601032187, -144.5209021782577)');
  });

  it('positions comparison chromosome labels properly after chromosome select', () => {
    comp.render();
    comp.renderChordMapForChr('1');

    expect(comp.getCompLabelPos('1', comp.compGMap, true)).toBe('translate(91.4980940834008, -121.61887832224237)');
    expect(comp.getCompLabelPos('5', comp.compGMap, true)).toBe('translate(129.8218068275923, 87.98032041810696)');
    expect(comp.getCompLabelPos('10', comp.compGMap, true)).toBe('translate(-66.00268686065043, 144.34937328186115)');
    expect(comp.getCompLabelPos('16', comp.compGMap, true)).toBe('translate(-152.22026893147842, -30.13194583419449)');
    expect(comp.getCompLabelPos('X', comp.compGMap, true)).toBe('translate(-44.561121142876175, -145.50018890452918)');
  });

  it('positions reference chromosome labels properly', () => {
    comp.render();

    expect(comp.getRefLabelPos('1', comp.refGMap)).toBe('translate(42.28436540983623, -210.6799098916053)');
    expect(comp.getRefLabelPos('5', comp.refGMap)).toBe('translate(215.95546733075088, 32.85506984241515)');
    expect(comp.getRefLabelPos('10', comp.refGMap)).toBe('translate(-30.95604668535741, 219.6559740238964)');
    expect(comp.getRefLabelPos('16', comp.refGMap)).toBe('translate(-212.5835080830503, -44.4054240239416)');
    expect(comp.getRefLabelPos('X', comp.refGMap)).toBe('translate(-90.46160388988635, -194.98687146113315)');
  });

  it('draws chord paths correctly', () => {
    comp.render();

    const blocks = comp.getGenomeBlocks();
    expect(comp.getChordPath(comp.compGMap, blocks[0]))
      .toBe('M1.2268917322350983,-187.99599659747378A205,205 0 0,1 3.558856898706454,-187.9663122412485Q0,0 42.8601461217864,117.42234827501585A 205,205 0 0,144.01763799070919,116.99336539188397Q0,0 1.2268917322350983,-187.99599659747378Z');
    expect(comp.getChordPath(comp.compGMap, blocks[blocks.length - 1]))
      .toBe('M59.479910208528416,178.3427606649213A205,205 0 0,1 58.27430151810996,178.74033059882262Q0,0 50.22582998075751,-114.46556688692036A 205,205 0 0,148.910911304369066,-115.03357229685663Q0,0 59.479910208528416,178.3427606649213Z');
  });

  it('"draws" the inner reference block (the empty space in the comparison ring for chords)', () => {
    comp.render();
    comp.renderChordMapForChr('1');

    expect(comp.getInnerRefBlockBandPath())
      .toBe('M0.2697566868275194,-124.99970892498075A125,125 0 0,1 48.43666555065033,-115.23406367187805L56.57402536315959,-134.59338636875356A146,146 0 0,0 0.3150758102145427,-145.9996600243775Z');
  });

  it('draws reference synteny blocks correctly', () => {
    comp.render();

    const blocks = comp.getGenomeBlocks();
    expect(comp.getBlockBandPath(comp.refRadii, comp.refGMap, blocks[0]))
      .toBe('M1.2268917322350983,-187.99599659747378A188,188 0 0,1 3.558856898706454,-187.9663122412485L3.95638878632792,-208.96254924691988A209,209 0 0,0 1.3639381491336997,-208.99554940889374Z');
    expect(comp.getBlockBandPath(comp.refRadii, comp.refGMap, blocks[blocks.length - 1]))
      .toBe('M59.479910208528416,178.3427606649213A188,188 0 0,1 58.27430151810996,178.74033059882262L64.78366498555842,198.70600582528684A209,209 0 0,0 66.12394273182149,198.26402648387526Z');
  });

  it('draws feature synteny blocks correctly', () => {
    comp.render();

    const blocks = comp.getGenomeBlocks();
    expect(comp.getBlockBandPath(comp.featureRadii, comp.refGMap, blocks[0]))
      .toBe('M1.1241069195611473,-172.24633198890882A172.25,172.25 0 0,1 3.260707982990355,-172.21913448699496L3.558856898706454,-187.9663122412485A188,188 0 0,0 1.2268917322350983,-187.99599659747378Z');
    expect(comp.getBlockBandPath(comp.featureRadii, comp.refGMap, blocks[blocks.length - 1]))
      .toBe('M54.496885816058615,163.40181130070582A172.25,172.25 0 0,1 53.39227891752362,163.76607417897443L58.27430151810996,178.74033059882262A188,188 0 0,0 59.479910208528416,178.3427606649213Z');
  });

  it('draws reference chromosome bands', () => {
    comp.render();

    expect(comp.getChrBandPath(comp.refRadii, comp.refGMap, '1', comp.ref.genome))
      .toBe('M-3.4535039735955356e-14,-188A188,188 0 0,1 72.8487449881781,-173.3120317625046L80.98610480068736,-192.6713544593801A209,209 0 0,0 -3.839267715326952e-14,-209Z');
    expect(comp.getChrBandPath(comp.refRadii, comp.refGMap, '5', comp.ref.genome))
      .toBe('M187.97025069299548,-3.344376535683948A188,188 0 0,1 180.0803032315328,53.991521445863995L200.19565625207636,60.02248926694455A209,209 0 0,0 208.96692763210666,-3.717950510414602Z');
    expect(comp.getChrBandPath(comp.refRadii, comp.refGMap, '10', comp.ref.genome))
      .toBe('M-2.5222762223761137,187.9830793519939A188,188 0 0,1 -51.858184319553494,180.70619446792415L-57.650853844610005,200.8914608712561A209,209 0 0,0 -2.8040198429606793,208.98118927961025Z');
    expect(comp.getChrBandPath(comp.refRadii, comp.refGMap, '16', comp.ref.genome))
      .toBe('M-186.58169829262752,-23.049292011663187A188,188 0 0,1 -178.28831926236342,-59.64289743633838L-198.2035038608189,-66.30513597975916A209,209 0 0,0 -207.4232709742508,-25.6239469704128Z');
    expect(comp.getChrBandPath(comp.refRadii, comp.refGMap, 'X', comp.ref.genome))
      .toBe('M-106.91456108987273,-154.63918205603608A188,188 0 0,1 -47.74212451265563,-181.83698619097845L-53.07502139970759,-202.1485644357154A209,209 0 0,0 -118.85714504140107,-171.9127077112316Z');
  });

  it('draws comparison chromosome bands', () => {
    comp.render();

    expect(comp.getChrBandPath(comp.compRadii, comp.compGMap, '1', comp.comp.genome))
      .toBe('M-2.2962127484012872e-14,-125A125,125 0 0,1 53.045778851041455,-113.18633020858307L61.95746969801642,-132.20163368362503A146,146 0 0,0 -2.6819764901327032e-14,-146Z');
    expect(comp.getChrBandPath(comp.compRadii, comp.compGMap, '5', comp.comp.genome))
      .toBe('M124.11027724944546,14.887547852678193A125,125 0 0,1 113.22722284351791,52.958436600265465L132.2493962812289,61.855453949110064A146,146 0 0,0 144.9608038273523,17.388655891928128Z');
    expect(comp.getChrBandPath(comp.compRadii, comp.compGMap, '10', comp.comp.genome))
      .toBe('M-15.961017290758335,123.97679592183415A125,125 0 0,1 -44.77635610673536,116.70508957968724L-52.2987839326669,136.3115446290747A146,146 0 0,0 -18.642468195605737,144.8048976367023Z');
    expect(comp.getChrBandPath(comp.compRadii, comp.compGMap, '16', comp.comp.genome))
      .toBe('M-124.84480658948868,-6.22689871711123A125,125 0 0,1 -122.28742327703712,-25.89953876544447L-142.83171038757936,-30.25066127803914A146,146 0 0,0 -145.81873409652277,-7.273017701585917Z');
    expect(comp.getChrBandPath(comp.compRadii, comp.compGMap, 'X', comp.comp.genome))
      .toBe('M-54.07928634132994,-112.69618799592311A125,125 0 0,1 -21.689364535446554,-123.10390516164999L-25.333177777401577,-143.78536122880718A146,146 0 0,0 -63.16460644667337,-131.6291475792382Z');
  });

  it('renders tooltip for reference chromosome no features', () => {
    const spyOnHighlightFeatures = spyOn(comp.highlightFeatures, 'emit');
    comp.render();
    comp.getTooltipContent(comp.ref, '1');

    expect(comp.tooltipContent.title).toBe('Mus musculus');
    expect(comp.tooltipContent.chr).toBe('1');
    expect(spyOnHighlightFeatures).toHaveBeenCalledWith([]);

    comp.hideTooltip();
    expect(comp.tooltipContent).toBeFalsy();
    expect(spyOnHighlightFeatures).toHaveBeenCalledTimes(2); // once for tooltip show and one for hide
  });

  it('renders tooltip for reference chromosome with gene features', () => {
    const spyOnHighlightFeatures = spyOn(comp.highlightFeatures, 'emit');
    comp.render();
    comp.updateFeatures(SELECTED_FEATURES_NO_SYNTENY);
    comp.getTooltipContent(comp.ref, '1');

    expect(comp.tooltipContent.title).toBe('Mus musculus');
    expect(comp.tooltipContent.chr).toBe('1');
    expect(spyOnHighlightFeatures).toHaveBeenCalledWith(SELECTED_FEATURES_NO_SYNTENY.map(f => f.id));

    comp.hideTooltip();
    expect(comp.tooltipContent).toBeFalsy();
    expect(spyOnHighlightFeatures).toHaveBeenCalledWith([]);
    expect(spyOnHighlightFeatures).toHaveBeenCalledTimes(2);
  });

  it('renders tooltip for reference chromosome with QTL features', () => {
    const spyOnHighlightFeatures = spyOn(comp.highlightFeatures, 'emit');
    comp.render();
    comp.updateFeatures(SELECTED_QTL_FEATURES);
    comp.getTooltipContent(comp.ref, '1');

    expect(comp.tooltipContent.title).toBe('Mus musculus');
    expect(comp.tooltipContent.chr).toBe('1');
    expect(spyOnHighlightFeatures).toHaveBeenCalledWith(SELECTED_QTL_FEATURES.map(f => f.id));

    comp.hideTooltip();
    expect(comp.tooltipContent).toBeFalsy();
    expect(spyOnHighlightFeatures).toHaveBeenCalledWith([]);
    expect(spyOnHighlightFeatures).toHaveBeenCalledTimes(2);
  });

  it('renders tooltip for reference chromosome with gene and QTL features', () => {
    const spyOnHighlightFeatures = spyOn(comp.highlightFeatures, 'emit');
    comp.render();
    comp.updateFeatures([...SELECTED_QTL_FEATURES, ...SELECTED_QTL_FEATURES]);
    comp.getTooltipContent(comp.ref, '1');

    expect(comp.tooltipContent.title).toBe('Mus musculus');
    expect(comp.tooltipContent.chr).toBe('1');
    expect(spyOnHighlightFeatures)
      .toHaveBeenCalledWith([...SELECTED_QTL_FEATURES, ...SELECTED_QTL_FEATURES].map(f => f.id));

    comp.hideTooltip();
    expect(comp.tooltipContent).toBeFalsy();
    expect(spyOnHighlightFeatures).toHaveBeenCalledWith([]);
    expect(spyOnHighlightFeatures).toHaveBeenCalledTimes(2);
  });

  it('renders tooltip for reference chromosome', () => {
    const spyOnHighlightFeatures = spyOn(comp.highlightFeatures, 'emit');
    comp.render();
    comp.getTooltipContent(comp.comp, '1');

    expect(comp.tooltipContent.title).toBe('Homo sapiens');
    expect(comp.tooltipContent.chr).toBe('1');
    expect(spyOnHighlightFeatures).toHaveBeenCalledWith([]);

    comp.hideTooltip();
    expect(comp.tooltipContent).toBeFalsy();
    expect(spyOnHighlightFeatures).toHaveBeenCalledTimes(2);
  });
});
