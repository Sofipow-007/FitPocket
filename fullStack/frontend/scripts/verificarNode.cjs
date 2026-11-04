// Corre antes de npm install. Con un Node viejo la instalación "funciona" pero el
// backend se rompe después con errores difíciles de entender: mejor frenar acá.
// Sin sintaxis moderna a propósito, para poder ejecutarse en cualquier versión.
var MINIMO = [20, 19];
var actual = process.versions.node.split('.').map(Number);
var alcanza = actual[0] > MINIMO[0] || (actual[0] === MINIMO[0] && actual[1] >= MINIMO[1]);
if (!alcanza) {
  console.error('\nFitPocket necesita Node ' + MINIMO.join('.') + ' o más nuevo (recomendado: 22 LTS).');
  console.error('Tenés Node ' + process.versions.node + '. Instalá la versión LTS desde https://nodejs.org,');
  console.error('cerrá y volvé a abrir la terminal, y corré npm install de nuevo.\n');
  process.exit(1);
}
