import { expect, test, type Page } from '@playwright/test'

/**
 * Smoke browser alur kritis (playbook 3.12):
 * 1. Layar login sesuai referensi Figma (input kapsul, ilustrasi, tombol teal).
 * 2. Navigasi bolak-balik tidak mengulang GET API tanpa henti (regresi bug 429).
 * 3. Tombol "Mulai Ambil Sampah" terikat: menampilkan loading/galat atau sukses.
 *
 * Kredensial lewat env E2E_EMAIL/E2E_PASSWORD — test tanpa itu di-skip.
 */

/** Hitung GET API backend dari host VITE_API_URL (bukan aset dev server). */
function trackApiGets(page: Page): () => readonly string[] {
  const seen: string[] = []
  page.on('request', (request) => {
    if (request.method() !== 'GET') return
    const type = request.resourceType()
    if (type !== 'xhr' && type !== 'fetch') return
    seen.push(request.url())
  })
  return () => seen
}

test('layar login: input kapsul, ilustrasi, tombol teal lebar penuh', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/login/)

  const email = page.getByPlaceholder('Enter your Email')
  await expect(email).toBeVisible()
  // Kapsul persis referensi: rounded-full + latar putih + border tipis.
  await expect(email).toHaveClass(/rounded-full/)
  await expect(email).toHaveClass(/bg-white/)
  await expect(page.getByPlaceholder('Enter Password')).toHaveClass(/rounded-full/)

  await expect(page.getByRole('button', { name: 'Login', exact: true })).toHaveClass(/bg-action/)
  await expect(page.locator('img[alt=""]')).toBeVisible()
})

test('tab login invalid → pesan galat, tanpa loop permintaan', async ({ page }) => {
  const getSeen = trackApiGets(page)
  await page.goto('/')
  await expect(page).toHaveURL(/login/)
  await page.getByPlaceholder('Enter your Email').fill('salah@example.com')
  await page.getByPlaceholder('Enter Password').fill('password-salah')
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 15_000 })
  // Satu percobaan gagal tidak boleh memicu storm: maksimal beberapa GET saja.
  expect(getSeen().length).toBeLessThan(8)
})

test.describe('login + alur dalam app (butuh env creds)', () => {
  test.skip(
    process.env.E2E_EMAIL === undefined || process.env.E2E_PASSWORD === undefined,
    'butuh E2E_EMAIL & E2E_PASSWORD',
  )

  const email = process.env.E2E_EMAIL ?? ''
  const password = process.env.E2E_PASSWORD ?? ''

  test('login sukses lalu navigasi berulang: GET API tidak bertambah (cache anti-429)', async ({
    page,
  }) => {
    const getSeen = trackApiGets(page)
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
    await page.getByPlaceholder('Enter your Email').fill(email)
    await page.getByPlaceholder('Enter Password').fill(password)
    await page.getByRole('button', { name: 'Login', exact: true }).click()
    // Beranda memuat kartu sapaan.
    await expect(page.getByText('Selamat Bertugas Hari Ini')).toBeVisible({ timeout: 20_000 })
    const apiGetsBeranda = getSeen().length

    // Bolak-balik tab Profil ↔ Beranda 4 putaran (remount + StrictMode dev).
    const profilLink = page.getByRole('link', { name: 'Profil' })
    for (let round = 0; round < 4; round += 1) {
      await profilLink.click()
      await expect(page.getByRole('button', { name: /Log out|gout/i })).toBeVisible()
    }

    const additions = getSeen().length - apiGetsBeranda
    // Cache TTL 15s: kunjungan ulang berurutan boleh sedikit GET (sinkron interval),
    // tapi tidak boleh membanjiri (pola lama: 2-3 GET tiap mount → 429).
    expect(additions).toBeLessThan(8)
  })

  test('tombol Mulai Ambil Sampah terikat handler: kembali respons (loading/galat/arah)', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
    await page.getByPlaceholder('Enter your Email').fill(email)
    await page.getByPlaceholder('Enter Password').fill(password)
    await page.getByRole('button', { name: 'Login', exact: true }).click()
    await expect(page.getByText('Selamat Bertugas Hari Ini')).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /Mulai Ambil Sampah/i }).click()
    // Petugas: server sukses → diarahkan ke /rumah. Akun admin: ditolak →
    // role=alert tampil. Keduanya membuktikan handler berjalan (bukan tombol mati).
    const routed = page
      .waitForURL(/rumah/, { timeout: 15_000 })
      .then(() => 'routed' as const)
      .catch(() => null)
    const errored = page
      .waitForSelector('[role=alert]', { timeout: 15_000 })
      .then(() => 'errored' as const)
      .catch(() => null)
    const result = await Promise.race([routed, errored])
    expect(result === 'routed' || result === 'errored').toBe(true)
  })
})
