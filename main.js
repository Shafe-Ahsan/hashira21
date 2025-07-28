const fs = require('fs'); // Node.js module for file system operations

/**
 * Decodes a string representation of a number from a given base to a BigInt (base 10).
 * Handles bases from 2 up to 36.
 *
 * @param {string} valueStr The string representing the number in the given base.
 * @param {number} base The base of the input string (e.g., 2, 10, 16).
 * @returns {bigint} The decoded number as a BigInt.
 * @throws {Error} If an invalid character for the base is found or a digit is out of range.
 */
function decodeYValue(valueStr, base) {
    if (base < 2 || base > 36) {
        throw new Error(`Unsupported base: ${base}. Base must be between 2 and 36.`);
    }

    let result = 0n; // Initialize as BigInt
    let power = 1n;  // Initialize as BigInt

    // Iterate from right to left (least significant digit to most significant)
    for (let i = valueStr.length - 1; i >= 0; i--) {
        const char = valueStr[i].toLowerCase();
        let digit;

        if (char >= '0' && char <= '9') {
            digit = BigInt(parseInt(char, 10)); // Convert character '0'-'9' to BigInt 0-9
        } else if (char >= 'a' && char <= 'z') {
            digit = BigInt(char.charCodeAt(0) - 'a'.charCodeAt(0) + 10); // Convert 'a'-'z' to BigInt 10-35
        } else {
            throw new Error(`Invalid character '${char}' for base ${base} in value: ${valueStr}`);
        }

        if (digit >= BigInt(base)) {
            throw new Error(`Digit ${digit} out of range for base ${base} in value: ${valueStr}`);
        }

        result = result + digit * power;
        power = power * BigInt(base);
    }
    return result;
}


 
 
function lagrangeInterpolateAtZero(points) {
    let secret = 0n; 
    const k = points.length; 

    for (let j = 0; j < k; ++j) {
        const [xj, yj] = points[j]; // Current point (x_j, y_j)

        let numeratorProduct = 1n;   // Product of (-x_m) terms
        let denominatorProduct = 1n; // Product of (x_j - x_m) terms

        for (let m = 0; m < k; ++m) {
            if (m !== j) {
                const [xm, _] = points[m]; // Other point (x_m, y_m)
                numeratorProduct = numeratorProduct * (0n - xm); // Calculate (-x_m)
                denominatorProduct = denominatorProduct * (xj - xm); // Calculate (x_j - x_m)
            }
        }

        
        const product_yj_num = numeratorProduct * yj;
        if (product_yj_num % denominatorProduct !== 0n) {
            
            throw new Error(
                `Non-exact division encountered for point (${xj}, ${yj}). ` +
                `Calculated: (${product_yj_num} / ${denominatorProduct}). ` +
                `This suggests the problem might require modular arithmetic or that these are invalid shares.`
            );
        }

        const term = product_yj_num / denominatorProduct;
        secret = secret + term;
    }

    return secret;
}

/**
 * Reads a JSON test case file, processes the shares, and finds the secret.
 *
 * @param {string} filepath The path to the JSON test case file.
 */
function solveTestCase(filepath) {
    let jsonData;
    try {
        // 1. Read the Test Case (Input) from a separate JSON file
        const fileContent = fs.readFileSync(filepath, 'utf8');
        jsonData = JSON.parse(fileContent);
    } catch (e) {
        console.error(`Error reading or parsing JSON from ${filepath}: ${e.message}`);
        return;
    }

    const n = jsonData.keys.n; // Total number of roots provided
    const k = jsonData.keys.k; // Minimum number of roots required (m+1)

    const allShares = []; // Store processed shares as [BigInt(x), BigInt(y)] pairs

    // Iterate through all keys in the JSON data, skipping the "keys" metadata
    for (const key in jsonData) {
        if (key === 'keys') {
            continue;
        }

        try {
            // x is the key of the object, convert to BigInt
            const xVal = BigInt(key);

            // Decode y value from its base
            const yValueData = jsonData[key];
            const yValueStr = yValueData.value;
            const yBase = yValueData.base;
            
            // 2. Decode the Y Values
            const yVal = decodeYValue(yValueStr, yBase);
            
            allShares.push([xVal, yVal]);
        } catch (e) {
            // Log a warning for any share that fails to parse/decode but continue processing others
            console.warn(`Warning: Skipping invalid share entry for key "${key}" in ${filepath}: ${e.message}`);
        }
        

    }

    if (allShares.length < k) {
        console.error(`Error: Not enough valid shares (${allShares.length}) found to meet k (${k}) requirement for ${filepath}.`);
        return;
    }

    // Sort shares by their x-value to ensure consistent selection of the first 'k' shares.
    // This is not strictly necessary for Lagrange interpolation itself, but good practice.
    // BigInt comparison: a < b works directly.
    allShares.sort((a, b) => {
        if (a[0] < b[0]) return -1;
        if (a[0] > b[0]) return 1;
        return 0;
    });

    // Select the first 'k' shares as per the problem's implicit instruction (no "wrong shares" mentioned).
    const sharesToUse = allShares.slice(0, k);

    try {
        // 3. Find the Secret (C)
        const secret = lagrangeInterpolateAtZero(sharesToUse);
        console.log(`Secret for ${filepath}: ${secret.toString()}`);
    } catch (e) {
        console.error(`Failed to find secret for ${filepath}: ${e.message}`);
    }
}

// --- Main Execution ---

// Create dummy JSON files for testing.
// In a real submission, you would expect these files to be provided.
// This part ensures the script is self-contained for testing.

// Test Case 1
const testCase1Content = `{
    "keys": {
        "n": 4,
        "k": 3
    },
    "1": { "base": "10", "value": "4" },
    "2": { "base": "2", "value": "111" },
    "3": { "base": "10", "value": "12" },
    "6": { "base": "4", "value": "213" }
}`;
fs.writeFileSync('testcase1.json', testCase1Content);

// Test Case 2
const testCase2Content = `{
  "keys": {
    "n": 10,
    "k": 7
  },
  "1": { "base": "6", "value": "13444211440455345511" },
  "2": { "base": "15", "value": "aed7015a346d63" },
  "3": { "base": "15", "value": "6aeeb69631c227c" },
  "4": { "base": "16", "value": "e1b5e05623d881f" },
  "5": { "base": "8", "value": "316034514573652620673" },
  "6": { "base": "3", "value": "2122212201122002221120200210011020220200" },
  "7": { "base": "3", "value": "20120221122211000100210021102001201112121" },
  "8": { "base": "6", "value": "20220554335330240002224253" },
  "9": { "base": "12", "value": "45153788322a1255483" },
  "10": { "base": "7", "value": "1101613130313526312514143" }
}`;
fs.writeFileSync('testcase2.json', testCase2Content);

console.log("Starting secret identification for test cases...\n");

solveTestCase('testcase1.json');
console.log(''); // Add a newline for better separation of outputs
solveTestCase('testcase2.json');

console.log("\nProcess completed.");
