export function toPascalCase(inputStr: string) {
  const pascaledString = inputStr
    .replace(/_|-/g, ' ')
    .replace(/(\w)(\w*)/g, (g0, g1, g2) => {
      return g1.toUpperCase() + g2.toLowerCase();
    })
    .replace(/ /g, '');
  return pascaledString;
}
