/**
 * DHKE utilities: modular exponentiation and key exchange computation.
 * Formulas: A = g^a mod p, B = g^b mod p, shared = A^b mod p = B^a mod p
 */

/**
 * Checks whether a number is prime (integer >= 2 with no divisors other than 1 and itself).
 * @param {number} n - Value to test.
 * @returns {boolean} True if n is prime, false otherwise.
 */
export function isPrime(n) {
  if (typeof n !== 'number' || n < 2 || !Number.isInteger(n)) return false
  if (n === 2) return true
  if (n % 2 === 0) return false
  for (let d = 3; d * d <= n; d += 2) {
    if (n % d === 0) return false
  }
  return true
}

/**
 * Computes modular exponentiation: (base^exp) mod mod.
 * Uses square-and-multiply with BigInt to support large exponents.
 * @param {number} base - Base (e.g. g in DHKE).
 * @param {number} exp - Exponent (e.g. private key a or b).
 * @param {number} mod - Modulus (e.g. prime p).
 * @returns {bigint} base^exp mod mod.
 */
export function modPow(base, exp, mod) {
  if (mod === 1n) return 0n
  base = BigInt(base) % BigInt(mod)
  let result = 1n
  let e = BigInt(exp)
  const m = BigInt(mod)
  while (e > 0n) {
    if (e % 2n === 1n) result = (result * base) % m
    e = e / 2n
    base = (base * base) % m
  }
  return result
}

/**
 * Computes the full DHKE: public keys A, B and the shared secret.
 * @param {number} g - Public generator.
 * @param {number} p - Public prime modulus.
 * @param {number} a - Alice's private key.
 * @param {number} b - Bob's private key.
 * @returns {{ g: number, p: number, a: number, b: number, A: number, B: number, shared: number }} All parameters plus public keys and shared secret.
 */
export function computeDHKE(g, p, a, b) {
  const A = Number(modPow(g, a, p))
  const B = Number(modPow(g, b, p))
  const sharedAlice = Number(modPow(B, a, p))
  const sharedBob = Number(modPow(A, b, p))
  return { g, p, a, b, A, B, shared: sharedAlice }
}
