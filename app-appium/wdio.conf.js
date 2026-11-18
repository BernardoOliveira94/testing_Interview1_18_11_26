// Exercise 1 - MB WAY app (native Android) - SKELETON, not executed.
// Tool: Appium + WebdriverIO (JavaScript). Playwright cannot drive native apps.
// Fill in the package id of the installed app (adb shell pm list packages | grep -i mbway) and the device name.
exports.config = {
  runner: 'local',
  port: 4723,
  specs: ['./test/specs/**/*.js'],
  framework: 'mocha',
  mochaOpts: { timeout: 60000 },
  capabilities: [{
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.DEVICE_NAME || 'Android Emulator',
    'appium:appPackage': process.env.APP_PACKAGE || '<MBWAY_PACKAGE_ID>',
    'appium:appActivity': process.env.APP_ACTIVITY || '<MAIN_ACTIVITY>',
    'appium:noReset': true,
  }],
};
