function permutations(arr) {
  if (arr.length <= 1) return [arr]

  const result = []

  for (let i = 0; i < arr.length; i++) {
    const current = arr[i]
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)]

    for (const p of permutations(rest)) {
      result.push([current, ...p])
    }
  }

  return result
}
module.exports = {
  permutations
}
