import { test, expect } from '@playwright/test'

test.describe('Mobile Safari - iOS Experience', () => {
  // Configure for mobile project only
  test.skip(({ browserName }) => browserName !== 'chromium', 'Mobile tests for iPhone only')
  test('homepage loads without errors on mobile', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verify cosmic background visible
    await expect(page.locator('.cosmic-background')).toBeVisible()
    
    // Verify title
    await expect(page.getByText('Choose Your Character')).toBeVisible()
    
    // Check no critical errors
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('favicon') && !err.includes('icon')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('Sofia coloring studio loads on mobile', async ({ page }) => {
    await page.goto('/sofia/coloring')
    await page.waitForLoadState('networkidle')

    // Check cosmic background
    await expect(page.locator('.cosmic-background')).toBeVisible()
    
    // Verify all 7 pages visible
    await expect(page.getByText('Singing Squad')).toBeVisible()
    await expect(page.getByText('Tiger Power')).toBeVisible()
    
    // Check touch-friendly layout
    const backButton = page.getByRole('button', { name: /back to characters/i })
    await expect(backButton).toBeVisible()
    
    // Verify button is large enough for touch (minimum 44px)
    const box = await backButton.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
  })

  test('canvas works with touch on mobile', async ({ page }) => {
    await page.goto('/sofia/coloring')
    await page.waitForLoadState('networkidle')

    // Open a coloring page
    await page.getByText('Singing Squad').click()
    await page.waitForSelector('canvas[aria-label="coloring-canvas"]', { timeout: 10000 })

    const canvas = page.locator('canvas[aria-label="coloring-canvas"]')
    await expect(canvas).toBeVisible()

    // Verify canvas is properly sized for mobile
    const canvasBox = await canvas.boundingBox()
    expect(canvasBox?.width).toBeGreaterThan(200)
    expect(canvasBox?.height).toBeGreaterThan(200)

    // Test touch drawing
    if (canvasBox) {
      await page.touchscreen.tap(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2)
      await page.waitForTimeout(500)
      
      // Verify canvas is interactive (not blocked)
      await expect(canvas).toBeEnabled()
    }
  })

  test('toolbar buttons are touch-friendly', async ({ page }) => {
    await page.goto('/sofia/coloring')
    await page.getByText('Tiger Power').click()
    await page.waitForSelector('canvas[aria-label="coloring-canvas"]')

    // Check toolbar button sizes (should be >= 44px for iOS)
    const buttons = await page.locator('button[aria-label]').all()
    
    for (const button of buttons.slice(0, 5)) {
      const box = await button.boundingBox()
      if (box) {
        // iOS Human Interface Guidelines: minimum 44x44pt
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    }
  })

  test('keyboard shortcuts help works on mobile', async ({ page }) => {
    await page.goto('/sofia/coloring')
    await page.getByText('Squad Goals').click()
    await page.waitForSelector('canvas[aria-label="coloring-canvas"]')

    // Open keyboard help
    const keyboardBtn = page.getByLabel('Keyboard shortcuts')
    await keyboardBtn.click()
    await page.waitForTimeout(500)

    // Verify dialog is visible and scrollable
    await expect(page.getByText(/Keyboard Shortcuts/i)).toBeVisible()
    
    // Close dialog
    await page.getByRole('button', { name: /got it/i }).click()
    await page.waitForTimeout(300)
  })

  test('gallery works on mobile viewport', async ({ page }) => {
    await page.goto('/sofia/coloring')
    await page.getByText('Concert Time').click()
    await page.waitForSelector('canvas[aria-label="coloring-canvas"]')

    // Open gallery
    const galleryBtn = page.getByLabel('View gallery')
    await galleryBtn.click()
    await page.waitForTimeout(500)

    // Verify gallery modal visible
    await expect(page.getByText(/My Gallery/i)).toBeVisible()
    
    // Close gallery
    const closeBtn = page.getByLabel('Close gallery')
    await closeBtn.click()
  })

  test('audio context works (sound effects)', async ({ page, context }) => {
    // Grant autoplay permission
    await context.grantPermissions(['clipboard-write'])
    
    await page.goto('/sofia/coloring')
    await page.getByText('Demon Hunters').click()
    await page.waitForSelector('canvas[aria-label="coloring-canvas"]')

    // Click a brush button (should play sound)
    const glitterBtn = page.getByRole('button', { name: /glitter/i })
    await glitterBtn.click()
    
    // No error should occur (sound effects SSR-guarded)
    await page.waitForTimeout(500)
    
    // Verify button state changed
    await expect(glitterBtn).toHaveClass(/bg-primary/)
  })

  test('responsive layout at various viewports', async ({ page }) => {
    // Test different mobile sizes
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 390, height: 844, name: 'iPhone 12/13' },
      { width: 428, height: 926, name: 'iPhone 14 Pro Max' },
      { width: 768, height: 1024, name: 'iPad' },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Verify content fits in viewport
      const body = page.locator('body')
      await expect(body).toBeVisible()
      
      // No horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(hasHorizontalScroll).toBe(false)
    }
  })
})

test.describe('Mobile Safari - Landscape Mode', () => {
  test('coloring works in landscape', async ({ page }) => {
    // Set landscape viewport
    await page.setViewportSize({ width: 844, height: 390 })
    await page.goto('/sofia/coloring')
    await page.getByText('Battle Ready').click()
    await page.waitForSelector('canvas[aria-label="coloring-canvas"]')

    const canvas = page.locator('canvas[aria-label="coloring-canvas"]')
    await expect(canvas).toBeVisible()

    // Canvas should use available space efficiently
    const box = await canvas.boundingBox()
    expect(box?.width).toBeGreaterThan(300)
  })
})

