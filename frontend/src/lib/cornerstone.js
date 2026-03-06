import { init as csInit, RenderingEngine, Enums, volumeLoader } from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import * as dicomImageLoader from '@cornerstonejs/dicom-image-loader';

let initialized = false;

export async function initCornerstone() {
  if (initialized) return;

  await csInit();
  await cornerstoneTools.init();
  await dicomImageLoader.init();

  initialized = true;
}

export { RenderingEngine, Enums, cornerstoneTools, dicomImageLoader };
