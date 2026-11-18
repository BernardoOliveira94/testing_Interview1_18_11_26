// =====================================================================================================
// app-appium/wdio.conf.js  -  SKELETON (never executed) for EXERCISE 1: automating the MB WAY mobile app.
// =====================================================================================================
// WHY APPIUM: Playwright drives web browsers only. A native phone app needs Appium, which talks to the phone.
// WebdriverIO (wdio) is the JavaScript test runner that sends commands to Appium. Same ideas as Playwright:
// find an element (locator), do an action (click/type), check the result (assertion).
// This file is the "settings" file: which phone, which app, where the tests are.
// =====================================================================================================
exports.config = {
  runner: 'local',                        // run on this computer
  port: 4723,                             // the port where the Appium server listens (Appium's default)
  specs: ['./test/specs/**/*.js'],        // where the test files are
  framework: 'mocha',                     // the test style: describe(...) / it(...)
  mochaOpts: { timeout: 60000 },          // each test may take up to 60 seconds (phones are slow)
  capabilities: [{                        // "capabilities" = description of the phone and app to control
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',                                  // Android driver used by Appium
    'appium:deviceName': process.env.DEVICE_NAME || 'Android Emulator',       // name of the phone/emulator
    'appium:appPackage': process.env.APP_PACKAGE || '<MBWAY_PACKAGE_ID>',     // unique id of the installed app
    'appium:appActivity': process.env.APP_ACTIVITY || '<MAIN_ACTIVITY>',      // the screen to open first
    'appium:noReset': true,               // do not wipe the app data between runs
  }],
};
