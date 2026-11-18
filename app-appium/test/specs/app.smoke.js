// Safe checks only: no real login, no payments. Locators are placeholders: find the real ones with Appium Inspector.
describe('MB WAY app - smoke (skeleton)', () => {
  it('shows the first screen on launch', async () => {
    const firstScreen = await $('~<first-screen-accessibility-id>');
    await expect(firstScreen).toBeDisplayed();
  });

  it('rejects an invalid phone number', async () => {
    await $('~<phone-input-id>').setValue('123');
    await $('~<continue-button-id>').click();
    await expect($('~<phone-error-id>')).toBeDisplayed();
  });
});
