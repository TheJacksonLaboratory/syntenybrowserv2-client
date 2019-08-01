import { Injectable } from '@angular/core';
import { saveSvgAsPng } from 'save-svg-as-png';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {

  constructor() { }

  /**
   * Initiates a download of the specified text with the specified filename
   * @param {string} text - the text to download
   * @param {string} filename - the name of the file to save the SVG as
   */
  downloadText(text: string, filename: string): void {
    let blob = new Blob([text], { type: 'data:text/plain;charset=utf-8,' });

    if(navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, filename);
    } else {
      let link = document.createElement('a');

      if(link.download !== undefined) {
        let url = URL.createObjectURL(blob);
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
    let options = { modifyCss: () => { return "margin-top: 0;" } };
    saveSvgAsPng(document.getElementById(svgSelector), filename, options);
  }
}
