# Exercise 1 - MB WAY app automation (skeleton, not executed)

**Tool choice:** Appium + WebdriverIO (JavaScript). Playwright, Cypress and Selenium drive web browsers, not native apps.
The concepts are the same ones used in Playwright: locators, waits, assertions, page objects.

## Why it is only a skeleton here
- A real device (or an emulator the app accepts) and the installed app are needed. Banking apps often block emulators and rooted devices.
- Login depends on a real phone number, SMS code, PIN and biometrics. Real payments move real money.
- Locators can only be found with the app installed (Appium Inspector).

## What to ask for
A test build or sandbox, test accounts, and the list of supported devices.

## Setup (when a device is available)
```bash
npm install --save-dev @wdio/cli appium
npx appium driver install uiautomator2
npx appium            # terminal 1
npx wdio run app-appium/wdio.conf.js   # terminal 2
```

## Scope proposed (80/20)
1. App launches and shows the expected first screen
2. Phone number validation (invalid formats show an error)
3. Navigation between the main screens (with a test account)
4. Error messages on invalid input

Full send-money / approve-payment flows: designed in `manual-tests/` (APP-006 to APP-020), automate once a sandbox exists.
