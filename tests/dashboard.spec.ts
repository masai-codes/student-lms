import { test, expect } from '@playwright/test'

test('test', async ({ page }) => {
  await page.goto('http://localhost:3002/seed-catalog')
  const page1Promise = page.waitForEvent('popup')
  await page
    .getByRole('button', {
      name: 'Login',
      description: 'Secret-login as student (userId 20)',
    })
    .click()
  const page1 = await page1Promise
  await page1.getByRole('button', { name: 'Got it' }).click()
  const page2Promise = page1.waitForEvent('popup')
  await page1.getByTestId('dashboard-fee-payment-cta').click()
  await page2Promise
  const elem = await page1.getByTestId('dashboard-fee-payment-days')
  const elemText = await elem.innerText()
  elem.click()
  expect(elemText.includes('8')).toBeTruthy()
  await page1.getByTestId('guided-tour-step-lecture-81').click()
  await page1.getByTestId('guided-tour-step-profile-photo').click()
  await page1.getByTestId('guided-tour-step-download-app').click()
  const page3Promise = page1.waitForEvent('popup')
  await page1.getByTestId('download-app-google-play').click()
  await page3Promise
  await page1.getByTestId('guided-tour-see-dashboard').click()
  await page1.getByTestId('dashboard-fee-payment-days').click()
  await page1.getByTestId('dashboard-onboarding-banner-resume').click()
  await page1.getByRole('heading', { name: "Let's get you started" }).click()
})
