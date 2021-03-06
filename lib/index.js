// Generated by CoffeeScript 1.7.1
var params;

params = require('./params');

params = params.parse();

if (params.command == null) {
  params.command = 'help';
}

switch (params.command) {
  case 'help':
    require('./commands/help')();
    break;
  case 'exec':
    require('./commands/exec')();
    break;
  case 'tree':
    require('./commands/tree')();
    break;
  default:
    require('./commands/run')();
}
