import { test } from '@playwright/test'

test('test', async ({ page }) => {
  await page.goto('http://localhost:3002/seed-catalog')
  const page1Promise = page.waitForEvent('popup')
  await page
    .getByRole('button', {
      name: 'Login',
      description: 'Secret-login as student (userId 4)',
    })
    .click()
  const page1 = await page1Promise
  await page1.getByRole('button', { name: 'Got it' }).click()
  await page1.getByRole('link', { name: 'Learn' }).click()
  await page1
    .getByRole('link', {
      name: '[live-lecture-phases] Transcript — timestamped segments (download + CC',
    })
    .click()
  await page1.getByRole('button', { name: 'Play', exact: true }).click()
  await page1.getByRole('slider', { name: 'Volume' }).fill('0.45')
  await page1.getByRole('button', { name: 'Turn on captions' }).click()
  await page1
    .getByRole('button', { name: 'Settings: volume, playback' })
    .click()
  await page1
    .getByRole('button', { name: 'Settings: volume, playback' })
    .click()
  await page1.getByRole('button', { name: 'Add bookmark' }).click()
  await page1.getByText('Bookmark added').click()
  await page1.getByRole('tab', { name: 'Associated Content' }).click()
  await page1.getByRole('tab', { name: 'Transcript' }).click()
  // await page1.getByText('Good evening everyone, and').click();
  const downloadPromise = page1.waitForEvent('download')
  await page1.getByTestId('lecture-transcript-download-button').click()
  await downloadPromise
  await page1.getByRole('button', { name: 'Open account menu' }).click()
  await page1.getByRole('menuitem', { name: 'Bookmark' }).click()
  await page1.getByTestId('bookmarks-item-1').click()
  await page1.getByRole('button', { name: 'Remove bookmark' }).click()
  await page1.getByText('Bookmark removed').click()
  await page1.getByRole('textbox', { name: 'Ask the AI tutor' }).click()
  await page1
    .getByRole('textbox', { name: 'Ask the AI tutor' })
    .fill('Can you summarise this lecture')
  await page1.getByText('Can you summarise this lecture').click()
  await page1.getByRole('button', { name: 'Close chat' }).click()
  await page1.getByRole('tab', { name: 'AI Summary' }).click()
  await page1.getByRole('tab', { name: 'Transcript' }).click()
  await page1.getByRole('tab', { name: 'Associated Content' }).click()
  await page1.getByRole('link', { name: 'Learn' }).click()
  await page1.getByRole('link', { name: 'Announcements' }).click()
  await page1.getByRole('link', { name: 'Home' }).click()
  await page1.getByTestId('dashboard-product-updates-view-all').click()
  await page1
    .getByRole('link', { name: '[dashboard-home] Product update #1' })
    .click()
  await page1
    .getByLabel('Primary', { exact: true })
    .getByRole('link', { name: 'Home' })
    .click()
  await page1.getByTestId('dashboard-pending-tasks-tab').click()
  await page1.getByRole('link', { name: 'Assignment [live-lecture-' }).click()
})
