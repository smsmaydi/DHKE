/**
 * DHKE - Diffie-Hellman Key Exchange Simulation
 * Formulas: A = g^a mod p, B = g^b mod p, shared = A^b mod p = B^a mod p
 */

/**
 * Computes modular exponentiation: (base^exp) mod mod.
 * Uses the square-and-multiply method with BigInt to avoid overflow for large values.
 * @param {number} base - The base (g in DHKE).
 * @param {number} exp - The exponent (private key a or b).
 * @param {number} mod - The modulus (p, the prime).
 * @returns {bigint} base^exp mod mod as a BigInt.
 */
function modPow(base, exp, mod) {
  if (mod === 1n) return 0n;
  base = BigInt(base) % BigInt(mod);
  let result = 1n;
  let e = BigInt(exp);
  const m = BigInt(mod);
  while (e > 0n) {
    if (e % 2n === 1n) result = (result * base) % m;
    e = e / 2n;
    base = (base * base) % m;
  }
  return result;
}

/**
 * Reads a numeric value from an input element by id.
 * Returns the fallback if the element is missing or the value is not a valid integer >= min.
 * @param {string} id - The id of the input element.
 * @param {number} defaultValue - Value to return when parsing fails or value is below minimum.
 * @returns {number} Parsed integer or defaultValue.
 */
function parseNum(id, defaultValue) {
  const el = document.getElementById(id);
  if (!el) return defaultValue;
  const v = parseInt(el.value, 10);
  return Number.isNaN(v) || v < 1 ? defaultValue : v;
}

/**
 * Collects DHKE parameters from the form inputs (g, p, a, b).
 * Ensures g and p are at least 2, and a and b are at least 1.
 * @returns {{ g: number, p: number, a: number, b: number }} The parameters for the key exchange.
 */
function getParams() {
  const g = Math.max(2, parseNum('input-g', 3));
  const p = Math.max(2, parseNum('input-p', 17));
  const a = Math.max(1, parseNum('input-a', 15));
  const b = Math.max(1, parseNum('input-b', 13));
  return { g, p, a, b };
}

/**
 * Runs the DHKE algorithm and updates all calculation and exchange fields in the DOM.
 * Computes public keys A, B and the shared secret, then writes them to the corresponding elements.
 * @returns {{ g: number, p: number, a: number, b: number, A: number, B: number, shared: number }} The full DHKE result (used for guess validation).
 */
function runDHKE() {
  const { g, p, a, b } = getParams();

  const A = Number(modPow(g, a, p));
  const B = Number(modPow(g, b, p));
  const sharedAlice = Number(modPow(B, a, p));
  const sharedBob = Number(modPow(A, b, p));
  const shared = sharedAlice;

  document.getElementById('calc-alice-public').textContent = `${g}^${a} mod ${p} = ${A}`;
  document.getElementById('calc-bob-public').textContent = `${g}^${b} mod ${p} = ${B}`;
  document.getElementById('exchange-to-bob').textContent = String(A);
  document.getElementById('exchange-to-alice').textContent = String(B);
  document.getElementById('sent-by-alice').textContent = String(A);
  document.getElementById('sent-by-bob').textContent = String(B);
  document.getElementById('calc-alice-shared').textContent = `${B}^${a} mod ${p} = ${sharedAlice}`;
  document.getElementById('calc-bob-shared').textContent = `${A}^${b} mod ${p} = ${sharedBob}`;
  document.getElementById('sharedSecretValue').textContent = String(shared);

  return { g, p, a, b, A, B, shared };
}

/** @type {{ g: number, p: number, a: number, b: number, A: number, B: number, shared: number } | null} Last DHKE result, used when checking the user's guess. */
let lastSharedSecret = null;

/**
 * Refreshes the UI by recomputing DHKE from current inputs and updating the DOM.
 * Also stores the result in lastSharedSecret for the guess-check feature.
 */
function updateUI() {
  lastSharedSecret = runDHKE();
}

/**
 * Toggles visibility of private calculations (eye icon).
 * When hidden: private keys and intermediate calculations are masked; when shown, they are visible.
 * Updates the app container class, the button icon, and the button label/aria-label.
 */
function toggleVisibility() {
  const app = document.querySelector('.app');
  const btn = document.getElementById('visibilityToggle');
  const label = document.getElementById('visibilityLabel');
  const isHidden = app.classList.toggle('hidden');
  btn.classList.toggle('hidden', isHidden);
  btn.setAttribute('aria-label', isHidden ? 'Show calculations' : 'Hide calculations');
  label.textContent = isHidden ? 'Show Calculations' : 'Hide Calculations';
}

/**
 * Validates the user's guess for the shared secret (Eve challenge).
 * Reads the guess from the input, compares it to lastSharedSecret.shared, and updates the feedback element with success or error message and styling.
 */
function checkGuess() {
  const input = document.getElementById('guess-input');
  const feedback = document.getElementById('guessFeedback');
  const value = input.value.trim();
  if (value === '') {
    feedback.textContent = 'Please enter a number.';
    feedback.className = 'guess-feedback wrong';
    return;
  }
  const num = parseInt(value, 10);
  if (Number.isNaN(num)) {
    feedback.textContent = 'Please enter a valid number.';
    feedback.className = 'guess-feedback wrong';
    return;
  }
  if (lastSharedSecret && num === lastSharedSecret.shared) {
    feedback.textContent = 'Correct! You found the shared secret.';
    feedback.className = 'guess-feedback correct';
  } else {
    feedback.textContent = 'Wrong. Try again.';
    feedback.className = 'guess-feedback wrong';
  }
}

/**
 * Initializes the DHKE simulation: attaches input and click listeners, then runs the first UI update.
 * Listens for input changes on g, p, a, b; click on visibility toggle and guess button; Enter key in guess input.
 */
function init() {
  ['input-g', 'input-p', 'input-a', 'input-b'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateUI);
  });
  document.getElementById('visibilityToggle').addEventListener('click', toggleVisibility);
  document.getElementById('guess-btn').addEventListener('click', checkGuess);
  document.getElementById('guess-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') checkGuess();
  });
  updateUI();
}

init();
