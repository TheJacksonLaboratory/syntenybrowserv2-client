import { Injectable } from '@angular/core';
import { saveSvgAsPng } from 'save-svg-as-png';

@Injectable({
  providedIn: 'root',
})
export class DownloadService {
  blobType = 'data:text/plain;charset=utf-8,';

  modifyCSS = (): string => 'margin-top: 0';

  /**
   * Initiates a download of the specified text with the specified filename
   * @param {string} text - the text to download
   * @param {string} filename - the name of the file to save the SVG as
   */
  downloadText(text: string, filename: string): void {
    const blob = new Blob([text], { type: this.blobType });

    if (navigator.msSaveBlob) {
      // IE 10+
      navigator.msSaveBlob(blob, filename);
    } else {
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }

  /**
   * Initiates a download of the SVG associated with the specified selector ID
   * and saves it with the specified filename
   * @param {string} svgSelector - the HTML ID of the SVG element to download
   * @param {string} filename - the name of the file to save the SVG as
   */
  downloadSVG(svgSelector: string, filename: string): void {
    const options = {
      modifyCss: this.modifyCSS(),
    };
    saveSvgAsPng(document.getElementById(svgSelector), filename, options);
  }
}
