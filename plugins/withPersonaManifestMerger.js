const { withAndroidManifest } = require('@expo/config-plugins');

function withPersonaManifestMerger(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const manifest = androidManifest.manifest;

    // 1. Ensure tools namespace is defined
    if (!manifest.$) {
      manifest.$ = {};
    }
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    // 2. Access the main <application> node
    const application = manifest.application && manifest.application[0];
    if (application) {
      if (!application['meta-data']) {
        application['meta-data'] = [];
      }

      // 3. Find if the com.google.mlkit.vision.DEPENDENCIES metadata already exists
      const existingMeta = application['meta-data'].find(
        (meta) => meta.$ && meta.$['android:name'] === 'com.google.mlkit.vision.DEPENDENCIES'
      );

      if (existingMeta) {
        existingMeta.$['android:value'] = 'ocr,face,barcode,barcode_ui';
        existingMeta.$['tools:replace'] = 'android:value';
      } else {
        application['meta-data'].push({
          $: {
            'android:name': 'com.google.mlkit.vision.DEPENDENCIES',
            'android:value': 'ocr,face,barcode,barcode_ui',
            'tools:replace': 'android:value',
          },
        });
      }
    }

    return config;
  });
}

module.exports = withPersonaManifestMerger;
