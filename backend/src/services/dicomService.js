import dicomParser from 'dicom-parser';

function getString(dataSet, tag) {
  try {
    const value = dataSet.string(tag);
    return value?.trim() || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

function getInt(dataSet, tag) {
  try {
    return dataSet.uint16(tag) ?? null;
  } catch {
    return null;
  }
}

export function parseDicom(buffer) {
  let dataSet;
  try {
    const byteArray = new Uint8Array(buffer);
    dataSet = dicomParser.parseDicom(byteArray);
  } catch (err) {
    throw new Error(`DICOM parse failed: ${err.message}`);
  }

  return {
    patientName: getString(dataSet, 'x00100010'),
    patientId: getString(dataSet, 'x00100020'),
    modality: getString(dataSet, 'x00080060'),
    bodyPartExamined: getString(dataSet, 'x00180015'),
    studyDate: getString(dataSet, 'x00080020'),
    studyInstanceUID: getString(dataSet, 'x0020000d'),
    studyDescription: getString(dataSet, 'x00081030'),
    institutionName: getString(dataSet, 'x00080080'),
    rows: getInt(dataSet, 'x00280010'),
    columns: getInt(dataSet, 'x00280011'),
  };
}
