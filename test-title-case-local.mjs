// Test the Title Case functionality locally
import { toTitleCase } from './utils/titleCase.js'

const testCases = [
  'this is a simple title',
  'THE BEST APP FOR KIDS',
  'my child loves this toy',
  'how to manage screen time',
  'AI powered learning app',
  'the amazing spider-man toy',
  "don't forget to check this",
  'tips and tricks for bedtime',
  'best educational apps for 5-year-olds',
  'LEGO friends building set review',
  'khan academy kids: free learning that actually works',
  'IT professionals recommend this app',
  'FAQ about parenting',
  'how I got my toddler to sleep',
  'must-have toys for development',
  'screen-free activities that work',
  'this amazing app helps kids learn math'
]

console.log('Testing Title Case Conversion:\n')

testCases.forEach(testCase => {
  const result = toTitleCase(testCase)
  console.log(`Input:  "${testCase}"`)
  console.log(`Output: "${result}"`)
  console.log('---')
})