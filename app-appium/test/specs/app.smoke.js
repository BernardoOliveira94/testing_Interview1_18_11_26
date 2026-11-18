// =====================================================================================================
// app-appium/test/specs/app.smoke.js  -  SKELETON (never executed): two safe smoke tests for the MB WAY app.
// =====================================================================================================
// Safe = no real login and no payments. The `<...>` values are placeholders: the real locators are found
// with the tool "Appium Inspector" once the app is installed on a device.
// `$('~id')` finds an element by its accessibility id (the "~" is the prefix that means accessibility id).
// =====================================================================================================
describe('MB WAY app - smoke (skeleton)', () => {           // describe = group of tests

  it('shows the first screen on launch', async () => {       // it = one test
    const firstScreen = await $('~<first-screen-accessibility-id>'); // find the element
    await expect(firstScreen).toBeDisplayed();                // check it is visible
  });

  it('rejects an invalid phone number', async () => {
    await $('~<phone-input-id>').setValue('123');             // type an invalid number
    await $('~<continue-button-id>').click();                 // press Continue
    await expect($('~<phone-error-id>')).toBeDisplayed();     // an error message must appear
  });
});
