import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Sofia Coloring Book E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Monitor console for hydration errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Navigate to Sofia's coloring studio
    await page.goto('/sofia/coloring')
    await page.waitForLoadState('networkidle')
    
    // Verify no hydration errors
    const hydrationErrors = consoleErrors.filter(err => 
      err.toLowerCase().includes('hydration') || 
      err.toLowerCase().includes('did not match')
    )
    expect(hydrationErrors).toHaveLength(0)
  })

  test('should render cosmic background and UI elements', async ({ page }) => {
    // Check cosmic background is present
    const cosmicBg = page.locator('.cosmic-background')
    await expect(cosmicBg).toBeVisible()

    // Check title is visible
    await expect(page.getByText(/Sofia's Coloring Studio/i)).toBeVisible()
    
    // Check subtitle
    await expect(page.getByText(/Choose a K-Pop Demon Hunters scene/i)).toBeVisible()

    // Check back button
    await expect(page.getByRole('button', { name: /back to characters/i })).toBeVisible()
  })

  test('should display all 7 coloring pages', async ({ page }) => {
    // Verify all pages are visible
    await expect(page.getByText('Singing Squad')).toBeVisible()
    await expect(page.getByText('Tiger Power')).toBeVisible()
    await expect(page.getByText('Laptop Friends')).toBeVisible()
    await expect(page.getByText('Squad Goals')).toBeVisible()
    await expect(page.getByText('Concert Time')).toBeVisible()
    await expect(page.getByText('Demon Hunters')).toBeVisible()
    await expect(page.getByText('Battle Ready')).toBeVisible()
  })

  test('should navigate to coloring canvas when page is clicked', async ({ page }) => {
    // Click on first coloring page
    await page.getByText('Singing Squad').click()
    
    // Wait for canvas to load
    await page.waitForSelector('canvas[aria-label="coloring-canvas"]', { timeout: 10000 })
    
    // Verify canvas is visible
    const canvas = page.locator('canvas[aria-label="coloring-canvas"]')
    await expect(canvas).toBeVisible()
    
    // Verify toolbar buttons are present
    await expect(page.getByLabel('Go home')).toBeVisible()
    await expect(page.getByLabel('Download artwork')).toBeVisible()
    await expect(page.getByLabel('Undo')).toBeVisible()
    await expect(page.getByLabel('Clear all')).toBeVisible()
  })

  test('canvas drawing functionality', async ({ page }) => {
    // Navigate to canvas
    await page.getByText('Singing Squad').click()
    await page.waitForSelector('canvas[aria-label="coloring-canvas"]')
    
    const canvas = page.locator('canvas[aria-label="coloring-canvas"]')
    
    // Get canvas bounding box
    const box = await canvas.boundingBox()
    expect(box).toBeTruthy()
    
    if (box) {
      // Draw a stroke across the canvas
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 100)
      await page.mouse.up()
      
      // Wait a bit for the drawing to complete
      await page.waitForTimeout(500)
      
      // Verify drawing occurred by checking canvas data
      const hasDrawing = await page.evaluate(() => {
        const canvas = document.querySelector('canvas[aria-label="coloring-canvas"]') as HTMLCanvasElement
        if (!canvas) return false
        
        const dataUrl = canvas.toDataURL()
        // If drawing happened, dataURL should be longer than a blank canvas
        return dataUrl.length > 1000
      })
      
      expect(hasDrawing).toBe(true)
    }
  })

  test('brush size controls work', async ({ page }) => {
    // Navigate to canvas
    await page.getByText('Tiger Power').click()
    await page.waitForSelector('canvas[aria-label="coloring-canvas"]')
    
    // Find brush size controls
    const increaseBtn = page.getByLabel('Increase brush size')
    const decreaseBtn = page.getByLabel('Decrease brush size')
    
    await expect(increaseBtn).toBeVisible()
    await expect(decreaseBtn).toBeVisible()
    
    // Get initial size
    const initialSize = await page.locator('text=/Size: \\d+/').textContent()
    expect(initialSize).toContain('Size:')
    
    // Increase brush size
    await increaseBtn.click()
    await page.waitForTimeout(200)
    
    const increasedSize = await page.locator('text=/Size: \\d+/').textContent()
    expect(increasedSize).not.toEqual(initialSize)
  })

  test('brush type selection works', async ({ page }) => {
    // Navigate to canvas
    await page.getByText('Squad Goals').click()
    await page.waitForSelector('canvas[aria-label="coloring-canvas"]')
    
    // Test brush type buttons
    const crayonBtn = page.getByRole('button', { name: /crayon/i })
    const glitterBtn = page.getByRole('button', { name: /glitter/i })
    const laserBtn = page.getByRole('button', { name: /laser/i })
    
    await expect(crayonBtn).toBeVisible()
    await expect(glitterBtn).toBeVisible()
    await expect(laserBtn).toBeVisible()
    
    // Click glitter brush
    await glitterBtn.click()
    await page.waitForTimeout(200)
    
    // Verify glitter button is active (has primary background)
    await expect(glitterBtn).toHaveClass(/bg-primary/)
  })

  test('color selection works', async ({ page }) => {
    // Navigate to canvas
    await page.getByText('Concert Time').click()
    await page.waitForSelector('canvas[aria-label="coloring-canvas"]')
    
    // Find color buttons (should be 8 colors)
    const colorButtons = page.locator('button[aria-label*="Select"]')
    const count = await colorButtons.count()
    expect(count).toBe(8)
    
    // Click a color
    await colorButtons.nth(1).click()
    await page.waitForTimeout(200)
    
    // Verify color is selected (has ring)
    await expect(colorButtons.nth(1)).toHaveClass(/ring-4/)
  })

  test('undo functionality works', async ({ page }) => {
    // Navigate to canvas
    await page.getByText('Demon Hunters').click()
    await page.waitForSelector('canvas[aria-label="coloring-canvas"]')
    
    const canvas = page.locator('canvas[aria-label="coloring-canvas"]')
    const box = await canvas.boundingBox()
    
    if (box) {
      // Draw something
      await page.mouse.move(box.x + 100, box.y + 100)
      await page.mouse.down()
      await page.mouse.move(box.x + 200, box.y + 200)
      await page.mouse.up()
      await page.waitForTimeout(500)
      
      // Get canvas state after drawing
      const afterDrawing = await page.evaluate(() => {
        const canvas = document.querySelector('canvas[aria-label="coloring-canvas"]') as HTMLCanvasElement
        return canvas?.toDataURL() || ''
      })
      
      // Click undo
      await page.getByLabel('Undo').click()
      await page.waitForTimeout(500)
      
      // Get canvas state after undo
      const afterUndo = await page.evaluate(() => {
        const canvas = document.querySelector('canvas[aria-label="coloring-canvas"]') as HTMLCanvasElement
        return canvas?.toDataURL() || ''
      })
      
      // Canvas should be different after undo
      expect(afterDrawing).not.toEqual(afterUndo)
    }
  })

  test('download functionality works', async ({ page }) => {
    // Navigate to canvas
    await page.getByText('Battle Ready').click()
    await page.waitForSelector('canvas[aria-label="coloring-canvas"]')
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download')
    
    // Click download button
    await page.getByLabel('Download artwork').click()
    
    // Wait for download
    const download = await downloadPromise
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/.*-colored\.png$/)
    
    // Check download has content
    const path = await download.path()
    expect(path).toBeTruthy()
  })

  test('clear canvas functionality', async ({ page }) => {
    // Navigate to canvas
    await page.getByText('Laptop Friends').click()
    await page.waitForSelector('canvas[aria-label="coloring-canvas"]')
    
    const canvas = page.locator('canvas[aria-label="coloring-canvas"]')
    const box = await canvas.boundingBox()
    
    if (box) {
      // Draw something
      await page.mouse.move(box.x + 150, box.y + 150)
      await page.mouse.down()
      await page.mouse.move(box.x + 250, box.y + 250)
      await page.mouse.up()
      await page.waitForTimeout(500)
      
      // Click clear
      await page.getByLabel('Clear all').click()
      
      // Confirm in dialog
      await page.getByRole('button', { name: /yes, erase/i }).click()
      await page.waitForTimeout(500)
      
      // Canvas should be cleared (back to initial state)
      const cleared = await page.evaluate(() => {
        const canvas = document.querySelector('canvas[aria-label="coloring-canvas"]') as HTMLCanvasElement
        if (!canvas) return false
        
        const ctx = canvas.getContext('2d')
        if (!ctx) return false
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Check if mostly white/transparent (cleared)
        let whitePixels = 0
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) {
            whitePixels++
          }
        }
        
        return whitePixels / (data.length / 4) > 0.9 // >90% white
      })
      
      expect(cleared).toBe(true)
    }
  })

  test('outline mode toggle works', async ({ page }) => {
    // Navigate to canvas
    await page.getByText('Singing Squad').click()
    await page.waitForSelector('canvas[aria-label="coloring-canvas"]')
    
    // Find outline toggle button (Eye icon)
    const outlineToggle = page.locator('button[aria-label*="mode"]').first()
    await expect(outlineToggle).toBeVisible()
    
    // Get initial state
    const initialTitle = await outlineToggle.getAttribute('title')
    
    // Toggle
    await outlineToggle.click()
    await page.waitForTimeout(1000) // Wait for edge detection
    
    // Get new state
    const newTitle = await outlineToggle.getAttribute('title')
    
    // Title should have changed
    expect(initialTitle).not.toEqual(newTitle)
  })

  test('responsive layout - mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/sofia/coloring')
    await page.waitForLoadState('networkidle')
    
    // Verify elements are visible on mobile
    await expect(page.getByText(/Sofia's Coloring Studio/i)).toBeVisible()
    
    // Navigate to canvas
    await page.getByText('Singing Squad').click()
    await page.waitForSelector('canvas[aria-label="coloring-canvas"]')
    
    const canvas = page.locator('canvas[aria-label="coloring-canvas"]')
    await expect(canvas).toBeVisible()
    
    // Verify canvas is not zero-sized
    const box = await canvas.boundingBox()
    expect(box?.width).toBeGreaterThan(100)
    expect(box?.height).toBeGreaterThan(100)
    
    // Toolbar should be visible
    await expect(page.getByLabel('Go home')).toBeVisible()
  })

  test('accessibility - basic checks', async ({ page }) => {
    // Run axe accessibility scan
    const results = await new AxeBuilder({ page }).analyze()
    
    // Should have no critical violations
    expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0)
    
    // Check toolbar buttons have labels
    await expect(page.getByLabel('Go home')).toBeVisible()
    await expect(page.getByLabel('Download artwork')).toBeVisible()
    await expect(page.getByLabel('Undo')).toBeVisible()
    await expect(page.getByLabel('Clear all')).toBeVisible()
  })

  test('back navigation works', async ({ page }) => {
    // Navigate to canvas
    await page.getByText('Tiger Power').click()
    await page.waitForSelector('canvas[aria-label="coloring-canvas"]')
    
    // Click home button
    await page.getByLabel('Go home').click()
    await page.waitForTimeout(500)
    
    // Should be back at coloring page selection
    await expect(page.getByText(/Sofia's Coloring Studio/i)).toBeVisible()
    await expect(page.getByText('Singing Squad')).toBeVisible()
  })
})


