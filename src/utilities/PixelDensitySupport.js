export const getCorrectFontSizeForScreen = (PixelRatio, screenWidth, screenHeight, currentFont) => {
  const devRatio = PixelRatio.get();
  const factor = (((screenWidth * devRatio) / 320) + ((screenHeight * devRatio) / 640)) / 2.0;
  const maxFontDifferFactor = 5; // the maximum pixels of font size we can go up or down

  if (factor <= 1) {
    return currentFont - float2int(maxFontDifferFactor * 0.3);
  } else if ((factor >= 1) && (factor <= 1.6)) {
    return currentFont - float2int(maxFontDifferFactor * 0.1);
  } else if ((factor >= 1.6) && (factor <= 2)) {
    return currentFont;
  } else if ((factor >= 2) && (factor <= 3)) {
    return currentFont + float2int(maxFontDifferFactor * 0.65);
  }

  return currentFont + float2int(maxFontDifferFactor);
};

export const float2int = value => value || 0;
