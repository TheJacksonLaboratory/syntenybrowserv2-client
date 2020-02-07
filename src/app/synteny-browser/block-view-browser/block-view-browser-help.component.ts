import { Component } from '@angular/core';

@Component({
  selector: 'block-view-browser-help',
  template: `
    <clr-modal clrModalSize="xl" [(clrModalOpen)]="open">
      <h3 class="modal-title">Using the Block View Browser</h3>

      <div class="modal-body">
        <ul>
          <li>
            When the chromosome you selected in the genome view is done rendering,
            you'll see five distinct elements (top to bottom): a set of tools,
            the linear genome view, a chromosome view, the reference and
            comparison tracks, and a comparison genome key.
          </li>
        </ul>

        <h3>The Tools</h3>

        <ul>
          <li>
            There are 4 distinct tools above the block view:

            <ul>
              <li>
                Block view filters - this allows you to create a secondary way
                to identify genes and be able to differentiate between your
                selected features. Common filters may look for gene associations
                to a specific ontology term or gene type. Clicking the edit
                button will open a dialog where you can create these filters and
                see more information as to how to make them. Once filters have
                been created, tags with the filter titles will be displayed in
                the field and filtered features will appear in blue in the tracks
                and as blue lines in the chromosome view.
              </li>
              <li>
                Jump to interval - allows you to enter a genomic range or
                cytogenetic band to make viewable. Click the info icon on this
                tool to see accepted interval formats.
              </li>
              <li>
                Block view navigation - allows you to zoom and pan using buttons
                if you don't have a trackpad that supports scrolling or a
                scrollwheel, or you prefer to not interact with the browser
                using scrolling.

                <ul>
                  <li>
                    The distance panned is relative to the size of the viewable
                    region in the tracks; the smaller the region you are viewing,
                    the smaller jumps the pan left or right will take. Keep in
                    mind that the viewable region in the tracks is also draggable.
                  </li>
                  <li>
                    Zooming out only goes as far as the edges of the reference
                    chromosome and zooming in will stop when the viewable region
                    hits 3000 basepairs wide.
                  </li>
                  <li>
                    If you have at least one feature selected, you can also jump
                    to any of those features using the 'Jump to' menu. Selecting
                    a feature from that menu will move the view directly to that
                    feature's location.
                  </li>
                </ul>
              </li>
              <li>
                Options - allows you to download the current block view and turn
                on/off extra visualization features.

                <ul>
                  <li>
                    Downloading - gives you the ability to download a snapshot
                    of the block view browser; this snapshot will include the
                    linear genome view, chromosome view, tracks and key, but
                    does not include the tools. Keep in mind that the downloaded
                    PNG will be a snapshot of the SVG so unless you are
                    particularly crafty, tooltips will not appear in them and
                    only what is visible on the screen at the time of download
                    will be included in the downloaded image.
                  </li>
                  <li>
                    Settings - allow to control the visibility of some aspects
                    or how they are arranged:

                    <ul>
                      <li>
                        'Show all gene symbols' (deselected by default): controls
                        the visibility of gene symbols. When the visible region
                        in the tracks is quite large gene symbols add a lot of
                        visual clutter to the tracks and significantly reduce the
                        performance of manipulation and interaction with the
                        tracks. We recommend checking this option only if you are
                        viewing a small region and want a more verbose context
                        for exploration or perhaps a downloaded image. Note here
                        that regardless of (de)selection of this option, selected
                        and filtered genes will always have visible gene symbols
                        and gene symbols of genes being hovered over will be
                        visible during the hover.
                      </li>
                      <li>
                        'Show gene anchors' (deselected by default): controls
                        the visibility of dashed lines that map the start of the
                        reference gene to the "start" of any/all comparison
                        homolog(s) and the end of the reference gene to the "end"
                        of any/all comparison homolog(s) ("start" and "end" are
                        a little ambiguous here since syntenic regions may be in
                        opposing alignments to make visualization more clear).
                        While making anchors visible can be helpful if you are
                        interested in genes that are located in a cluster of
                        other genes or perhaps if the location of a reference
                        gene's homolog(s) are far from the reference gene (this
                        may often be the case if you have the 'Show synteny in
                        true orientation' option checked as well and you are
                        viewing a syntenic region that are opposingly aligned).
                        These anchors tend to add a lot of clutter to the tracks
                        and may slow down manipulation and interaction with the
                        tracks depending on the size of the viewable region so
                        select at your own risk.
                      </li>
                      <li>
                        'Show synteny in true orientation' (deselected by
                        default): Since syntenic regions are generated by
                        evaluating the number and proximity of homologous genes
                        across two distinct species genomes, there are situations
                        where these regions are located on different strands of
                        the species' chromosomes. What this translates to in the
                        block view would be homologous genes at the left of the
                        region in the reference and the homologs being located
                        on the right of the comparison region. When exploring
                        the tracks, this can become difficult since you may not
                        be able to zoom in close enough to see details while
                        keeping the reference gene and any homologs in the same
                        view. To solve this issue, we introduced the concept of
                        "matching" orientation where the syntenic region and all
                        of the contained genes in the comparison track are
                        flipped horizontally if the regions between the species
                        are not truly aligned. If a region has a red cross
                        between the reference and comparison track, this means
                        that it has been flipped to match up with the reference.
                        By selecting the 'Show synteny in true orientation'
                        option, all of these aforementioned regions will be
                        returned to their TRUE orientation by flipping the
                        comparison regions and all of the contained genes to
                        their true positions (region and gene starts are always
                        less than their respective ends).
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>

        <h3>The Genome View</h3>

        <ul>
          <li>
            The linear genome view shows you all of the same reference chromosomes
            as are presented in the circular genome view, just in a linear format.
          </li>
          <li>
            The chromosome that you selected will be highlighted in this linear
            genome view and map to the chromosome view.
          </li>
        </ul>

        <h3>The Chromosome View</h3>

        <ul>
          <li>
            The chromosome view contains several bits of information and can be
            interacted with.
          </li>
          <li>
            If you have features that you selected in the reference chromosome
            or have created filters to highlight they will show up in the
            chromosome view.

            <ul>
              <li>
                Selected genes will appear as small red lines above the chromosome
                view. Any homologs in the comparison genome to selected reference
                genes appear as small red lines below the chromsome view.
              </li>
              <li>
                Selected QTLs will appear as purple lines (or dots, if the QTL
                is very small).
              </li>
              <li>
                If you have creating any block view filters that affect genes,
                they will appear as small blue lines above or below the chromosome
                view, see the guide in the block view filters to learn more
                about filtering.
              </li>
            </ul>
          </li>
          <li>
            Hovering over the feature lines will display a tooltip containing
            basic information about that feature.
          </li>
          <li>
            The box in the chromosome view represents the viewable region in the
            tracks below. You can click and drag this box to pan the view or
            drag the right or left edge of the box to make finer adjustments.
          </li>
          <li>
            When the block view is rendered, if you have no selected features,
            it will make the viewable region in the tracks the entire extent of
            the reference chromosome. If you have at least one selected feature,
            the viewable region will jump to fit the first feature.
          </li>
        </ul>

        <h3>The Block View Tracks</h3>

        <ul>
          <li>
            You are able to use a scroll wheel or scrollable trackpad to zoom in
            and out while your mouse is over this area and you can click and
            drag the tracks back and forth to pan. Keep in mind that the same
            limitation for zooming using the block view navigation goes for
            scrolling to zoom: zooming in will stop when the visible region
            reaches a minimum of 3000 basepairs and you will not be able to zoom
            beyond the extents of the current chromosome.
          </li>
          <li>
            There are a couple of notable parts of the tracks in the browser:
            the interval starts and ends that are located on the far left and
            right edges of the viewable regions of the tracks, the reference
            track, consisting of a series of grey syntenic regions and reference
            genes (and QTLs if you selected any), orientation indicators as red
            crosses between the two tracks, and the comparison track consisting
            of colored regions mirroring the size and order of the grey ones in
            the reference track, and comparison HOMOLOGOUS genes (this is
            explained further below).

            <ul>
              <li>
                The reference interval indicators display the reference species,
                chromosome and genomic location (in basepairs) for the starting
                and ending points of the visible region of the reference track.
                Since the reference track is linear, these start and end values
                will always be visible but this is not the case for the
                comparison interval start and ends points.
              </li>
              <li>
                The comparison interval indicators display the comparison species,
                chromosome and genomic location (in basepairs) for the starting
                and ending points of the visible region of the comparison track.

                <ul>
                  <li>
                    Since the comparison track consists of regions that are often
                    non-linear and spread across several different chromosomes in
                    the comparison genome, it is possible that the starting point
                    may be located in a completely different chromosome than the
                    ending point.
                  </li>
                  <li>
                    This also means that if the visible region of the tracks
                    starts or ends outside or between syntenic regions, there
                    will not be an accurate comparison location for that point.
                    Instead, assuming that there is at least one syntenic region
                    in view, the comparison start will be the same as the genomic
                    "start" of the first visible syntenic region in the
                    comparison track and the comparison end will be the same as
                    the genomic "end" of the last visible sytenic region in the
                    comparison track (see the section about the 'Show synteny in
                    true orientation' option for more information about why start
                    and end are in quotes, here).
                  </li>
                  <li>
                    If a genomic region is not truly oriented between the two
                    species you may notice as you manipulate the view that moving
                    right may not cause a start/end point to increase as you may
                    expect since the true orientation is reverse from that being
                    shown.
                  </li>
                  <li>
                    If your current reference interval is located between two
                    syntenic regions, the comparison interval values should not
                    be visible.
                  </li>
                </ul>
              </li>
              <li>
                The reference track contains all known genes (and possibly QTLs
                if they have been selected) and syntenic regions located in the
                reference species on the selected chromosome.

                <ul>
                  <li>
                    Any genes you selected in previous steps will appear in this
                    track in red with its symbol visible and any genes that have
                    matched at least one filter you may have created will appear
                    in blue, also with its symbol visible.
                  </li>
                  <li>
                    Hovering over any gene will show its gene symbol (if it isn't
                    already visible) and a tooltip containing basic information
                    about the gene as well as coloring any homologs in the
                    comparison track green.
                  </li>
                  <li>
                    Clicking on the gene will open a dialog box containing more
                    detailed information including external links to pages for
                    the gene in sites like NCBI or MGI.
                  </li>
                  <li>
                    If you selected any QTLs in a previous step, they will appear
                    as purple-shaded blocks in the reference track (currently
                    only for mouse when mouse is the reference species). Hovering
                    over these blocks will open a tooltip with information about
                    the QTL.
                  </li>
                  <li>
                    If a visible syntenic region is visually wide enough to
                    display start and end points for that region, they will be
                    displayed directly above the region at the far left and right
                    for the start and end, respectively.
                  </li>
                  <li>
                    If the syntenic region is too narrow to display these points,
                    hovering over the region will display a tooltip with some
                    basic information about that region including its start and
                    end positions.
                  </li>
                </ul>
              </li>
              <li>
                The comparison track contains all <b>homologous</b> genes to
                those in the reference chromosome and syntenic regions located
                in the reference species on the selected chromosome, colored
                according to the comparison genome key (which is consistent
                with the colors used in the circular genome view as well). Keep
                in mind that there may be genes in the comparison genome that
                reside within a syntenic region, but they may not be present due
                to them not being homologous to any genes in the reference
                chromosome.

                <ul>
                  <li>
                    Any genes that are homologous to reference genes you selected
                    in previous steps will appear in this track in red and any
                    genes that have matched at least one filter you may have
                    created will appear in blue. In both cases, the gene's gene
                    symbol will be visible
                  </li>
                  <li>
                    Hovering over any gene will show its gene symbol (if it
                    isn't already visible) and a tooltip containing basic
                    information about the gene as well as coloring its homologs
                    in the reference track green.
                  </li>
                  <li>
                    Clicking on the gene will open a dialog box containing more
                    detailed information including external links to pages for
                    the gene in sites like NCBI or MGI.
                  </li>
                  <li>
                    If a visible syntenic region is visually wide enough to
                    display start and end points for that region, they will be
                    displayed directly below the region at the far left and right
                    for the start and end, respectively.
                  </li>
                  <li>
                    If the syntenic region is too narrow to display these points,
                    hovering over the region will display a tooltip with some
                    basic information about that region including its start and
                    end positions.
                  </li>
                </ul>
              </li>
              <li>
                If you see a region in the reference and comparison track that
                are separated by a red cross (orientation indicator), this means
                that the comparison block has been flipped horizontally to better
                match the order and proximity of genes in the region in the
                reference genome but that the true orientation of these comparison
                genes is different. If you wish to see the true orientation for
                all syntenic regions in a chromosome, make sure that the 'Show
                synteny in true orientation' option in the settings menu (top
                right of the panel) is selected. These indicators also let you
                know when the "start" and "end" points of genes and syntenic
                regions may decrease going from left to right (where typically
                values increase left to right). More information on orientation
                is located above in the section describing the 'Show synteny in
                true orientation' option.
              </li>
            </ul>
          </li>
        </ul>

        <h3>The Comparison Genome Key</h3>

        <ul>
          <li>
            The comparison genome key contains a set of colored circles, each
            representing a chromosome in the comparison genome (these colors are
            consistent with those in the circular genome view).
          </li>
          <li>
            Depending on which reference chromosome you are viewing, there will
            be a set of these chromosomes in the key that are highlighted and
            others that are more muted. The highlighted chromosomes are those
            that are represented in the tracks as at least one syntenic region
            and those that are muted are not represented.
          </li>
          <li>
            Sometimes a comparison chromosome may be represented only once and
            as a very small region. If you hover over one of the represented
            chromosomes, it will mute all syntenic regions that represent regions
            in all other chromosomes in the comparison track and chromosome view
            to help you locate the regions associated with the chromosome.
          </li>
          <li>
            Hovering over comparison chromosomes in the key that are not
            represented in the current reference chromosomes will do anything.
          </li>
        </ul>
      </div>
    </clr-modal>
  `,
})
export class BlockViewBrowserHelpComponent {
  // indicates if the modal is open or not
  open: boolean;
}
